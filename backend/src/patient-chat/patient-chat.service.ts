import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage } from './entities/chat-message.entity.js';
import { MessageRole } from './enums/message-role.enum.js';
import { SessionStatus } from './enums/session-status.enum.js';
import { buildPatientChatPrompt } from './prompts/patient-chat.prompt.js';
import { Patient } from '../patients/patient.entity.js';
import { WhatsAppService } from '../shared/whatsapp/whatsapp.service.js';

const URGENCY_KEYWORDS = [
  'sangramento', 'sangue', 'hemorragia',
  'dor forte', 'dor intensa',
  'perda de liquido', 'bolsa rompeu',
  'nao sinto o bebe', 'bebe nao mexe',
  'desmaiei', 'desmaio', 'tontura forte',
  'febre alta', 'convulsao',
  'pressao alta', 'visao turva', 'visao embaçada',
  'suicidio', 'me matar', 'nao aguento mais',
];

const MAX_MESSAGES_PER_SESSION = 20;

@Injectable()
export class PatientChatService {
  private readonly logger = new Logger(PatientChatService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
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

  async processIncomingMessage(
    whatsappNumber: string,
    messageText: string,
    whatsappMessageId: string,
  ): Promise<void> {
    const startTime = Date.now();

    // 1. Encontrar ou criar sessao
    let session = await this.findActiveSession(whatsappNumber);
    if (!session) {
      session = await this.createSession(whatsappNumber);
    }
    if (!session) {
      this.logger.warn(`Nao foi possivel criar sessao para ${whatsappNumber}`);
      return;
    }

    // 2. Rate limit
    if (session.messageCount >= MAX_MESSAGES_PER_SESSION) {
      await this.whatsAppService.sendConsultationSummary(
        whatsappNumber,
        'Paciente',
        'Voce atingiu o limite de mensagens desta conversa. Para mais duvidas, entre em contato com sua clinica.',
      );
      return;
    }

    // 3. Salvar mensagem da paciente
    await this.messageRepo.save(
      this.messageRepo.create({
        sessionId: session.id,
        role: MessageRole.PATIENT,
        content: messageText,
        metadata: { whatsapp_message_id: whatsappMessageId },
      }),
    );

    // 4. Verificar urgencia
    if (this.shouldEscalate(messageText)) {
      await this.escalateToDoctor(session, messageText);
      return;
    }

    // 5. Carregar historico recente
    const history = await this.messageRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
      take: 10,
    });

    // 6. Gerar resposta via IA
    try {
      const patient = await this.patientRepo.findOneBy({ id: session.patientId });
      const patientName = patient?.fullName?.split(' ')[0] ?? 'Paciente';

      const prompt = buildPatientChatPrompt({
        patientName,
        consultationContext: session.consultationContext,
        conversationHistory: history.map((m) => ({ role: m.role, content: m.content })),
        newMessage: messageText,
      });

      const response = await this.getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const aiResponse = textBlock && textBlock.type === 'text' ? textBlock.text : 'Desculpe, nao consegui processar sua mensagem. Tente novamente.';

      // 7. Salvar resposta
      await this.messageRepo.save(
        this.messageRepo.create({
          sessionId: session.id,
          role: MessageRole.ASSISTANT,
          content: aiResponse,
          metadata: { response_time_ms: Date.now() - startTime },
        }),
      );

      // 8. Enviar via WhatsApp
      await this.whatsAppService.sendConsultationSummary(whatsappNumber, patientName, aiResponse);

      // 9. Incrementar contagem
      await this.sessionRepo.increment({ id: session.id }, 'messageCount', 1);
    } catch (err) {
      this.logger.error(`Falha ao processar mensagem: ${(err as Error).message}`);
    }
  }

  private async findActiveSession(whatsappNumber: string): Promise<ChatSession | null> {
    return this.sessionRepo.findOne({
      where: { whatsappNumber, status: SessionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  private async createSession(whatsappNumber: string): Promise<ChatSession | null> {
    // Encontrar paciente pelo telefone
    const patient = await this.patientRepo.findOneBy({ phone: whatsappNumber });
    if (!patient) {
      this.logger.warn(`Paciente nao encontrada para telefone ${whatsappNumber}`);
      return null;
    }

    // Buscar ultimo resumo enviado para contexto
    const [summaryRow] = await this.sessionRepo.query(
      `SELECT cs.id, cs.consultation_id, cs.doctor_id, cs.summary_text, cs.source_data, cs.tenant_id
       FROM consultation_summaries cs
       WHERE cs.patient_id = $1 AND cs.status IN ('sent', 'delivered', 'read')
       ORDER BY cs.created_at DESC LIMIT 1`,
      [patient.id],
    ) as any[];

    return this.sessionRepo.save(
      this.sessionRepo.create({
        tenantId: patient.tenantId,
        patientId: patient.id,
        consultationId: summaryRow?.consultation_id ?? null,
        summaryId: summaryRow?.id ?? null,
        doctorId: summaryRow?.doctor_id ?? null,
        whatsappNumber,
        consultationContext: summaryRow
          ? { summaryText: summaryRow.summary_text, sourceData: summaryRow.source_data }
          : null,
      }),
    );
  }

  private shouldEscalate(message: string): boolean {
    const lower = message.toLowerCase();
    return URGENCY_KEYWORDS.some((kw) => lower.includes(kw));
  }

  private async escalateToDoctor(session: ChatSession, triggerMessage: string): Promise<void> {
    session.escalatedToDoctor = true;
    session.escalatedAt = new Date();
    session.escalationReason = triggerMessage;
    session.status = SessionStatus.ESCALATED;
    await this.sessionRepo.save(session);

    await this.whatsAppService.sendConsultationSummary(
      session.whatsappNumber,
      'Paciente',
      '🚨 Entendo que voce pode estar passando por uma situacao que precisa de atencao medica urgente. ' +
        'Estou notificando seu medico(a) agora. ' +
        'Se estiver sentindo algo grave, procure o pronto-socorro mais proximo imediatamente. ' +
        'Ligue 192 (SAMU) se for emergencia.',
    );

    await this.messageRepo.save(
      this.messageRepo.create({
        sessionId: session.id,
        role: MessageRole.SYSTEM,
        content: `ESCALATION: ${triggerMessage}`,
        metadata: { escalated: true },
      }),
    );
  }
}
