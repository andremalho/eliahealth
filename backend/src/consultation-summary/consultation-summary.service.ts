import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { ConsultationSummary, SummarySourceData } from './consultation-summary.entity.js';
import { SummaryStatus } from './enums/summary-status.enum.js';
import { DeliveryChannel } from './enums/delivery-channel.enum.js';
import { buildSummaryPrompt, SummaryPromptData } from './prompts/summary-generation.prompt.js';
import { Consultation } from '../consultations/consultation.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { User } from '../auth/user.entity.js';
import { WhatsAppService } from '../shared/whatsapp/whatsapp.service.js';

@Injectable()
export class ConsultationSummaryService {
  private readonly logger = new Logger(ConsultationSummaryService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(ConsultationSummary)
    private readonly repo: Repository<ConsultationSummary>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Pregnancy)
    private readonly pregnancyRepo: Repository<Pregnancy>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      this.anthropicClient = new Anthropic({ apiKey });
    }
    return this.anthropicClient;
  }

  // ── 1. Gerar resumo via IA ──

  async generateSummary(
    consultationId: string,
    tenantId: string | null,
    doctorId: string,
  ): Promise<ConsultationSummary> {
    const consultation = await this.consultationRepo.findOneBy({ id: consultationId });
    if (!consultation) {
      throw new NotFoundException(`Consulta ${consultationId} nao encontrada`);
    }

    const pregnancy = await this.pregnancyRepo.findOne({
      where: { id: consultation.pregnancyId },
      relations: ['patient'],
    });
    if (!pregnancy) {
      throw new NotFoundException(`Gestacao nao encontrada para consulta ${consultationId}`);
    }

    const patient = pregnancy.patient;
    const doctor = await this.userRepo.findOneBy({ id: doctorId });

    // Buscar prescricoes da consulta via raw query
    const prescriptionRows: { medications: Record<string, unknown>[] }[] =
      await this.consultationRepo.query(
        `SELECT medications FROM prescriptions WHERE consultation_id = $1`,
        [consultationId],
      );

    const prescriptionTexts: string[] = [];
    for (const row of prescriptionRows) {
      if (Array.isArray(row.medications)) {
        for (const med of row.medications) {
          const parts = [med.name, med.dosage, med.frequency, med.duration]
            .filter(Boolean)
            .join(' - ');
          prescriptionTexts.push(parts || JSON.stringify(med));
        }
      }
    }

    // Montar source data
    const alerts: string[] = [];
    if (consultation.alerts) {
      for (const a of consultation.alerts) {
        alerts.push(`[${a.level}] ${a.message}`);
      }
    }

    const gaWeeks = Math.floor(consultation.gestationalAgeDays / 7);
    const gaDays = consultation.gestationalAgeDays % 7;
    const gestationalAge = `${gaWeeks} semanas e ${gaDays} dias`;

    const sourceData: SummarySourceData = {
      diagnoses: consultation.assessment ? [consultation.assessment] : [],
      prescriptions: prescriptionTexts,
      examsRequested: [],
      orientations: consultation.plan ? [consultation.plan] : [],
      alerts,
      gestationalAge,
    };

    // Criar registro em status GENERATING
    const summary = this.repo.create({
      tenantId,
      consultationId,
      patientId: patient.id,
      doctorId,
      summaryText: '',
      sourceData,
      status: SummaryStatus.GENERATING,
    });
    const saved = await this.repo.save(summary);

    // Chamar Anthropic API
    try {
      const patientAge = patient.dateOfBirth
        ? this.calculateAge(patient.dateOfBirth)
        : 0;

      const promptData: SummaryPromptData = {
        patientName: patient.fullName,
        patientAge,
        gestationalAge,
        lifePhase: 'gestante',
        educationLevel: patient.education || undefined,
        diagnoses: sourceData.diagnoses,
        prescriptions: sourceData.prescriptions,
        examsRequested: sourceData.examsRequested,
        orientations: sourceData.orientations,
        alerts: sourceData.alerts,
        doctorName: doctor?.name || 'Medico(a)',
      };

      const aiText = await this.callAnthropicForSummary(promptData);

      saved.summaryText = aiText;
      saved.originalAiText = aiText;
      saved.status = SummaryStatus.DRAFT;
      return this.repo.save(saved);
    } catch (err) {
      this.logger.error(
        `Falha ao gerar resumo IA para consulta ${consultationId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      saved.status = SummaryStatus.FAILED;
      saved.deliveryLog = [
        ...saved.deliveryLog,
        {
          channel: 'ai_generation',
          status: 'failed',
          timestamp: new Date().toISOString(),
          error: (err as Error).message,
        },
      ];
      return this.repo.save(saved);
    }
  }

  // ── 2. Medico aprova (com ou sem edicao) ──

  async approveSummary(
    summaryId: string,
    doctorId: string,
    editedText?: string,
    deliveryChannel?: DeliveryChannel,
  ): Promise<ConsultationSummary> {
    const summary = await this.findById(summaryId);

    if (summary.doctorId !== doctorId) {
      throw new BadRequestException('Apenas o medico da consulta pode aprovar o resumo');
    }

    if (summary.status !== SummaryStatus.DRAFT && summary.status !== SummaryStatus.FAILED) {
      throw new BadRequestException(`Resumo em status ${summary.status} nao pode ser aprovado`);
    }

    if (editedText) {
      summary.summaryText = editedText;
    }
    if (deliveryChannel) {
      summary.deliveryChannel = deliveryChannel;
    }

    summary.status = SummaryStatus.APPROVED;
    summary.approvedAt = new Date();
    return this.repo.save(summary);
  }

  // ── 3. Enviar para paciente ──

  async sendSummary(summaryId: string): Promise<ConsultationSummary> {
    const summary = await this.findById(summaryId);

    if (summary.status !== SummaryStatus.APPROVED) {
      throw new BadRequestException('Resumo precisa ser aprovado antes do envio');
    }

    const patient = await this.patientRepo.findOneBy({ id: summary.patientId });
    if (!patient) {
      throw new NotFoundException('Paciente nao encontrada');
    }

    const channel = summary.deliveryChannel;

    // Enviar via WhatsApp
    if (channel === DeliveryChannel.WHATSAPP || channel === DeliveryChannel.BOTH) {
      await this.sendViaWhatsApp(summary, patient);
    }

    // Disponibilizar no portal (o registro ja existe — basta marcar como sent)
    if (channel === DeliveryChannel.PORTAL || channel === DeliveryChannel.BOTH) {
      this.publishToPortal(summary);
    }

    summary.status = SummaryStatus.SENT;
    summary.sentAt = new Date();
    return this.repo.save(summary);
  }

  // ── 4. Marcar como lido ──

  async markAsRead(summaryId: string, patientId: string): Promise<ConsultationSummary> {
    const summary = await this.repo.findOneBy({ id: summaryId, patientId });
    if (!summary) {
      throw new NotFoundException('Resumo nao encontrado');
    }

    if (!summary.readAt) {
      summary.readAt = new Date();
      summary.status = SummaryStatus.READ;
      return this.repo.save(summary);
    }
    return summary;
  }

  // ── 5. Listar resumos da paciente ──

  async getPatientSummaries(
    patientId: string,
    tenantId: string | null,
    page = 1,
    limit = 20,
  ) {
    const where: Record<string, unknown> = { patientId };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    // Apenas resumos ja enviados (visíveis para a paciente)
    const [data, total] = await this.repo.findAndCount({
      where: [
        { ...where, status: SummaryStatus.SENT },
        { ...where, status: SummaryStatus.DELIVERED },
        { ...where, status: SummaryStatus.READ },
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── 6. Buscar resumo por ID ──

  async findById(summaryId: string): Promise<ConsultationSummary> {
    const summary = await this.repo.findOneBy({ id: summaryId });
    if (!summary) {
      throw new NotFoundException(`Resumo ${summaryId} nao encontrado`);
    }
    return summary;
  }

  // ── 7. Listar resumos de uma consulta (para o medico) ──

  async findByConsultation(
    consultationId: string,
    tenantId: string | null,
  ): Promise<ConsultationSummary[]> {
    const where: Record<string, unknown> = { consultationId };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ── Private: chamar Anthropic API ──

  private async callAnthropicForSummary(data: SummaryPromptData): Promise<string> {
    const prompt = buildSummaryPrompt(data);

    const response = await this.getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Resposta da IA nao continha texto');
    }
    return textBlock.text;
  }

  // ── Private: enviar via WhatsApp ──

  private async sendViaWhatsApp(
    summary: ConsultationSummary,
    patient: Patient,
  ): Promise<void> {
    try {
      if (!patient.phone) {
        this.logger.warn(`Paciente ${patient.id} sem telefone — WhatsApp nao enviado`);
        summary.deliveryLog = [
          ...summary.deliveryLog,
          {
            channel: 'whatsapp',
            status: 'skipped',
            timestamp: new Date().toISOString(),
            error: 'Paciente sem telefone cadastrado',
          },
        ];
        return;
      }

      await this.whatsAppService.sendConsultationSummary(
        patient.phone,
        patient.fullName,
        summary.summaryText,
      );

      summary.deliveryLog = [
        ...summary.deliveryLog,
        {
          channel: 'whatsapp',
          status: 'sent',
          timestamp: new Date().toISOString(),
        },
      ];
    } catch (err) {
      this.logger.error(
        `Falha ao enviar WhatsApp para paciente ${patient.id}: ${(err as Error).message}`,
      );
      summary.deliveryLog = [
        ...summary.deliveryLog,
        {
          channel: 'whatsapp',
          status: 'failed',
          timestamp: new Date().toISOString(),
          error: (err as Error).message,
        },
      ];
    }
  }

  // ── Private: publicar no portal ──

  private publishToPortal(summary: ConsultationSummary): void {
    // O resumo ja esta salvo no banco — o portal consulta diretamente.
    // Apenas registramos no log.
    summary.deliveryLog = [
      ...summary.deliveryLog,
      {
        channel: 'portal',
        status: 'published',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  // ── Private: calcular idade ──

  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
