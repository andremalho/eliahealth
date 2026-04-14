import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { CopilotCheck } from './entities/copilot-check.entity.js';
import { CopilotCheckItem } from './entities/copilot-check-item.entity.js';
import { CheckSeverity } from './enums/check-severity.enum.js';
import { CheckCategory } from './enums/check-category.enum.js';
import { CheckResolution } from './enums/check-resolution.enum.js';
import { ClinicalContext } from './enums/clinical-context.enum.js';
import { CopilotCheckResult, CopilotCheckResultItem } from './interfaces/copilot-check-result.interface.js';
import {
  buildPostConsultationCheckPrompt,
  PostConsultationCheckPromptData,
} from './prompts/post-consultation-check.prompt.js';
import { Consultation } from '../consultations/consultation.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { ConsultationsService } from '../consultations/consultations.service.js';
import { LabResultsService } from '../lab-results/lab-results.service.js';
import { VaccinesService } from '../vaccines/vaccines.service.js';
import { PrescriptionsService } from '../prescriptions/prescriptions.service.js';
import { GlucoseMonitoringService } from '../glucose-monitoring/glucose-monitoring.service.js';
import { BpMonitoringService } from '../bp-monitoring/bp-monitoring.service.js';
import { ClinicalProtocolsService } from '../clinical-protocols/clinical-protocols.service.js';
import { ConsultationSummaryService } from '../consultation-summary/consultation-summary.service.js';

@Injectable()
export class ClinicalCopilotService {
  private readonly logger = new Logger(ClinicalCopilotService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(CopilotCheck)
    private readonly checkRepo: Repository<CopilotCheck>,
    @InjectRepository(CopilotCheckItem)
    private readonly checkItemRepo: Repository<CopilotCheckItem>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Pregnancy)
    private readonly pregnancyRepo: Repository<Pregnancy>,
    private readonly configService: ConfigService,
    private readonly pregnanciesService: PregnanciesService,
    private readonly consultationsService: ConsultationsService,
    private readonly labResultsService: LabResultsService,
    private readonly vaccinesService: VaccinesService,
    private readonly prescriptionsService: PrescriptionsService,
    private readonly glucoseService: GlucoseMonitoringService,
    private readonly bpService: BpMonitoringService,
    private readonly protocolsService: ClinicalProtocolsService,
    private readonly summaryService: ConsultationSummaryService,
  ) {}

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      this.anthropicClient = new Anthropic({ apiKey });
    }
    return this.anthropicClient;
  }

  // ── METODO PRINCIPAL: Gera checklist pos-consulta ──

  async generatePostConsultationCheck(
    consultationId: string,
    tenantId: string | null,
    doctorId: string,
  ): Promise<CopilotCheck> {
    const startTime = Date.now();

    // 1. Buscar consulta e gestacao
    const consultation = await this.consultationRepo.findOneBy({ id: consultationId });
    if (!consultation) {
      throw new NotFoundException(`Consulta ${consultationId} nao encontrada`);
    }

    const pregnancy = await this.pregnancyRepo.findOne({
      where: { id: consultation.pregnancyId },
      relations: ['patient'],
    });
    if (!pregnancy) {
      throw new NotFoundException('Gestacao nao encontrada');
    }

    const patient = pregnancy.patient;
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);

    // 2. Coletar dados em paralelo (performance critica < 5s)
    const [
      recentConsultationsResult,
      labAlerts,
      examScheduleCheck,
      vaccineCard,
      activePrescriptions,
      glucoseAlerts,
      bpAlerts,
    ] = await Promise.all([
      this.consultationsService.findAllByPregnancy(consultation.pregnancyId, 1, 5),
      this.labResultsService.findAlerts(consultation.pregnancyId),
      this.protocolsService.checkExamSchedule(consultation.pregnancyId),
      this.vaccinesService.getVaccineCard(consultation.pregnancyId),
      this.prescriptionsService.findActive(consultation.pregnancyId),
      this.glucoseService.findAlerts(consultation.pregnancyId).catch(() => []),
      this.bpService.findAlerts(consultation.pregnancyId).catch(() => []),
    ]);

    // 3. Determinar contexto clinico
    const clinicalContext = this.determineClinicalContext(consultation, pregnancy);

    // 4. Montar dados do prompt
    const gaWeeks = Math.floor(ga.totalDays / 7);
    const gaDays = ga.totalDays % 7;

    const promptData: PostConsultationCheckPromptData = {
      clinicalContext,
      patient: {
        name: patient.fullName,
        age: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : 0,
        gestationalAge: `${gaWeeks} semanas e ${gaDays} dias`,
        gestationalAgeDays: ga.totalDays,
        gravida: pregnancy.gravida,
        para: pregnancy.para,
        abortus: pregnancy.abortus,
        isHighRisk: pregnancy.isHighRisk,
        highRiskFlags: pregnancy.highRiskFlags,
        bloodType: patient.bloodType ?? undefined,
        comorbidities: patient.comorbidities ?? undefined,
        comorbiditiesSelected: patient.comorbiditiesSelected ?? undefined,
        allergies: patient.allergies ?? undefined,
        allergiesSelected: patient.allergiesSelected ?? undefined,
        currentMedications: pregnancy.currentMedications ?? undefined,
        currentPathologies: pregnancy.currentPathologies ?? undefined,
      },
      consultation: {
        date: consultation.date,
        subjective: consultation.subjective ?? undefined,
        objective: consultation.objective ?? undefined,
        assessment: consultation.assessment ?? undefined,
        plan: consultation.plan ?? undefined,
        bpSystolic: consultation.bpSystolic ?? undefined,
        bpDiastolic: consultation.bpDiastolic ?? undefined,
        weightKg: consultation.weightKg ?? undefined,
        fetalHeartRate: consultation.fetalHeartRate ?? undefined,
        fetalMovements: consultation.fetalMovements ?? undefined,
        edemaGrade: consultation.edemaGrade ?? undefined,
        fundalHeightCm: consultation.fundalHeightCm ?? undefined,
        alerts: consultation.alerts?.map((a) => ({ level: a.level, message: a.message })) ?? [],
      },
      prescriptions: activePrescriptions.map((p: any) => ({
        medications: p.medications ?? [],
        notes: p.notes ?? undefined,
      })),
      recentConsultations: (recentConsultationsResult.data as Consultation[])
        .filter((c) => c.id !== consultationId)
        .slice(0, 5)
        .map((c) => ({
          date: c.date,
          gestationalAgeDays: c.gestationalAgeDays,
          assessment: c.assessment ?? undefined,
          plan: c.plan ?? undefined,
          bpSystolic: c.bpSystolic ?? undefined,
          bpDiastolic: c.bpDiastolic ?? undefined,
        })),
      pendingExams: (examScheduleCheck?.pending ?? []).map((e: any) => ({
        examName: e.schedule?.examName ?? 'Exame',
        requestedDate: e.schedule?.gaWeeksIdeal ? `IG ${e.schedule.gaWeeksIdeal} sem` : 'N/D',
      })),
      labResults: labAlerts.map((l: any) => ({
        examName: l.examName,
        value: String(l.value ?? ''),
        unit: l.unit ?? '',
        date: l.collectionDate ?? l.resultDate ?? '',
        alertTriggered: l.alertTriggered ?? false,
      })),
      vaccines: (vaccineCard?.vaccines ?? []).flat().map((v: any) => ({
        vaccineType: v.vaccineType ?? v.vaccine_type ?? '',
        status: v.status ?? '',
        dateAdministered: v.dateAdministered ?? v.date_administered ?? undefined,
      })),
      glucoseAlerts: (glucoseAlerts as any[]).map((g: any) => ({
        glucoseValue: g.glucoseValue ?? g.glucose_value ?? 0,
        measurementType: g.measurementType ?? g.measurement_type ?? '',
        readingDate: g.readingDate ?? g.reading_date ?? '',
      })),
      bpAlerts: (bpAlerts as any[]).map((b: any) => ({
        systolic: b.systolic ?? 0,
        diastolic: b.diastolic ?? 0,
        readingDate: b.readingDate ?? b.reading_date ?? '',
      })),
      activeAlerts: consultation.alerts?.map((a) => ({ level: a.level, message: a.message })) ?? [],
    };

    // 5. Chamar Anthropic API
    let checkItems: Partial<CopilotCheckItem>[];
    try {
      const prompt = buildPostConsultationCheckPrompt(promptData);
      const aiResponse = await this.callAnthropic(prompt);
      checkItems = this.parseAIResponse(aiResponse);
    } catch (err) {
      this.logger.error(
        `Falha ao gerar checklist para consulta ${consultationId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      // Retorna checklist vazio ao inves de bloquear o medico
      checkItems = [];
    }

    // 6. Salvar no banco
    const check = this.checkRepo.create({
      tenantId,
      consultationId,
      patientId: patient.id,
      doctorId,
      clinicalContext,
      items: checkItems as CopilotCheckItem[],
      totalItems: checkItems.length,
      actionRequiredCount: checkItems.filter((i) => i.severity === CheckSeverity.ACTION_REQUIRED).length,
      attentionCount: checkItems.filter((i) => i.severity === CheckSeverity.ATTENTION).length,
      okCount: checkItems.filter((i) => i.severity === CheckSeverity.OK).length,
      generationTimeMs: Date.now() - startTime,
      sourceSnapshot: { consultationDate: consultation.date, patientAge: promptData.patient.age, ga: promptData.patient.gestationalAge },
    });

    return this.checkRepo.save(check);
  }

  // ── Medico resolve um item ──

  async resolveCheckItem(
    itemId: string,
    doctorId: string,
    resolution: CheckResolution,
    note?: string,
  ): Promise<CopilotCheckItem> {
    const item = await this.checkItemRepo.findOneBy({ id: itemId });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} nao encontrado`);
    }

    if (resolution === CheckResolution.IGNORED && !note) {
      throw new BadRequestException('Justificativa obrigatoria ao ignorar recomendacao');
    }

    item.resolution = resolution;
    item.resolutionNote = note ?? null;
    item.resolvedAt = new Date();
    return this.checkItemRepo.save(item);
  }

  // ── Medico marca checklist como revisado ──

  async markCheckAsReviewed(
    checkId: string,
    doctorId: string,
  ): Promise<CopilotCheck> {
    const check = await this.checkRepo.findOne({
      where: { id: checkId },
      relations: ['items'],
    });
    if (!check) {
      throw new NotFoundException(`Checklist ${checkId} nao encontrado`);
    }

    const unresolvedActions = check.items.filter(
      (i) => i.severity === CheckSeverity.ACTION_REQUIRED && !i.resolution,
    );

    if (unresolvedActions.length > 0) {
      throw new BadRequestException(
        `${unresolvedActions.length} item(ns) de acao obrigatoria nao resolvido(s)`,
      );
    }

    check.reviewedByDoctor = true;
    check.reviewedAt = new Date();
    const saved = await this.checkRepo.save(check);

    // Disparar geracao do resumo para paciente (Fase 1) apos revisao do checklist
    try {
      await this.summaryService.generateSummary(
        check.consultationId,
        check.tenantId,
        check.doctorId,
      );
    } catch (err) {
      this.logger.warn(
        `Falha ao gerar resumo apos revisao do checklist ${checkId}: ${(err as Error).message}`,
      );
    }

    return saved;
  }

  // ── Busca checklist de uma consulta ──

  async getCheckByConsultation(
    consultationId: string,
    tenantId: string | null,
  ): Promise<CopilotCheck | null> {
    const where: Record<string, unknown> = { consultationId };
    if (tenantId) where.tenantId = tenantId;

    return this.checkRepo.findOne({
      where,
      relations: ['items'],
    });
  }

  // ── Estatisticas do medico ──

  async getDoctorCheckStats(
    doctorId: string,
    tenantId: string | null,
    from?: string,
    to?: string,
  ) {
    const qb = this.checkRepo
      .createQueryBuilder('c')
      .where('c.doctor_id = :doctorId', { doctorId });

    if (tenantId) qb.andWhere('c.tenant_id = :tenantId', { tenantId });
    if (from) qb.andWhere('c.created_at >= :from', { from });
    if (to) qb.andWhere('c.created_at <= :to', { to });

    const checks = await qb.getMany();

    const totalChecks = checks.length;
    if (totalChecks === 0) {
      return { totalChecks: 0, avgActionRequired: 0, avgGenerationTimeMs: 0, reviewedRate: 0 };
    }

    const avgActionRequired = checks.reduce((s, c) => s + c.actionRequiredCount, 0) / totalChecks;
    const avgGenerationTimeMs = checks.reduce((s, c) => s + (c.generationTimeMs ?? 0), 0) / totalChecks;
    const reviewedRate = checks.filter((c) => c.reviewedByDoctor).length / totalChecks;

    // Most common categories from items
    const allItemIds = checks.map((c) => c.id);
    let categoryStats: { category: string; count: string }[] = [];
    if (allItemIds.length > 0) {
      categoryStats = await this.checkItemRepo
        .createQueryBuilder('i')
        .select('i.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where('i.copilot_check_id IN (:...ids)', { ids: allItemIds })
        .andWhere('i.severity != :ok', { ok: CheckSeverity.OK })
        .groupBy('i.category')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany();
    }

    return {
      totalChecks,
      avgActionRequired: Math.round(avgActionRequired * 10) / 10,
      avgGenerationTimeMs: Math.round(avgGenerationTimeMs),
      reviewedRate: Math.round(reviewedRate * 100),
      mostCommonCategories: categoryStats.map((c) => ({
        category: c.category,
        count: Number(c.count),
      })),
    };
  }

  // ── Private: chamar Anthropic API ──

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await this.getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Resposta da IA nao continha texto');
    }
    return textBlock.text;
  }

  // ── Private: parsear resposta da IA ──

  private parseAIResponse(response: string): Partial<CopilotCheckItem>[] {
    try {
      // Extrair JSON da resposta (pode vir com markdown code blocks)
      let jsonStr = response.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed: CopilotCheckResult = JSON.parse(jsonStr);

      if (!parsed.items || !Array.isArray(parsed.items)) {
        this.logger.warn('Resposta da IA sem array items');
        return [];
      }

      const validSeverities = Object.values(CheckSeverity);
      const validCategories = Object.values(CheckCategory);

      // Ordenar: ACTION_REQUIRED > ATTENTION > OK
      const severityOrder: Record<string, number> = {
        action_required: 0,
        attention: 1,
        ok: 2,
      };

      return parsed.items
        .filter((item) => {
          if (!item.title || !item.description) return false;
          if (!validSeverities.includes(item.severity as CheckSeverity)) return false;
          return true;
        })
        .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
        .slice(0, 10)
        .map((item, index) => ({
          severity: item.severity as CheckSeverity,
          category: validCategories.includes(item.category as CheckCategory)
            ? (item.category as CheckCategory)
            : CheckCategory.EXAM,
          title: item.title.slice(0, 500),
          description: item.description,
          suggestedAction: item.suggested_action ?? null,
          guidelineReference: item.guideline_reference?.slice(0, 200) ?? null,
          displayOrder: index,
        }));
    } catch (err) {
      this.logger.error(`Falha ao parsear resposta da IA: ${(err as Error).message}`);
      this.logger.debug(`Resposta raw: ${response.slice(0, 500)}`);
      return [];
    }
  }

  // ── Private: determinar contexto clinico ──

  private determineClinicalContext(
    consultation: Consultation,
    pregnancy: Pregnancy,
  ): ClinicalContext {
    // Consultas com gestacao ativa = prenatal
    if (consultation.gestationalAgeDays > 0) {
      return ClinicalContext.PRENATAL;
    }
    return ClinicalContext.GENERAL;
  }

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
