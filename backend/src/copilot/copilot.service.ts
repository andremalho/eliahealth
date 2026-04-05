import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { CopilotAlert } from './copilot-alert.entity.js';
import { AlertType, AlertSeverity } from './copilot.enums.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { ConsultationsService } from '../consultations/consultations.service.js';
import { LabResultsService } from '../lab-results/lab-results.service.js';
import { ClinicalProtocolsService } from '../clinical-protocols/clinical-protocols.service.js';

const SYSTEM_PROMPT = `Você é um assistente clínico especializado em medicina materno-fetal e obstetrícia de alto risco, treinado nos protocolos da FEBRASGO, FIGO, FMF e Ministério da Saúde do Brasil. Analise os dados clínicos fornecidos e retorne APENAS um JSON válido com a estrutura: {"alerts": [{"type": "pattern_detected|exam_overdue|red_flag|suggestion|risk_increase", "severity": "info|warning|urgent|critical", "title": string, "message": string, "recommendation": string}], "riskLevel": "low|moderate|high|critical", "summary": string}. Seja objetivo, baseado em evidências e clinicamente preciso. Atenção especial para sinais de HELLP síndrome: elevação de enzimas hepáticas (TGO/TGP >70 U/L), plaquetopenia progressiva (<150.000), hemólise (DHL >600 U/L, esquizócitos, bilirrubina elevada), associados a hipertensão e proteinúria. Considere também hiperuricemia (>5,5 mg/dL) como marcador de risco para pré-eclâmpsia.`;

interface AiAnalysisResult {
  alerts: { type: string; severity: string; title: string; message: string; recommendation: string }[];
  riskLevel: string;
  summary: string;
}

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(CopilotAlert)
    private readonly alertRepo: Repository<CopilotAlert>,
    private readonly configService: ConfigService,
    private readonly pregnanciesService: PregnanciesService,
    private readonly consultationsService: ConsultationsService,
    private readonly labResultsService: LabResultsService,
    private readonly clinicalProtocolsService: ClinicalProtocolsService,
  ) {}

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      this.logger.log(`Inicializando Anthropic client (key presente: ${!!apiKey})`);
      this.anthropicClient = new Anthropic({ apiKey });
    }
    return this.anthropicClient;
  }

  // ── Análise completa com IA ──

  async analyzePregnancy(pregnancyId: string) {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);
    const consultationsPage = await this.consultationsService.findAllByPregnancy(pregnancyId, 1, 500);
    const lastConsultations = consultationsPage.data.slice(-5);
    const labAlerts = await this.labResultsService.findAlerts(pregnancyId);
    const examCheck = await this.clinicalProtocolsService.checkExamSchedule(pregnancyId);

    const clinicalContext = JSON.stringify({
      pregnancy: {
        gaWeeks: ga.weeks,
        gaDays: ga.days,
        edd: pregnancy.edd,
        gaMethod: pregnancy.gaMethod,
        gravida: pregnancy.gravida,
        para: pregnancy.para,
        abortus: pregnancy.abortus,
        plurality: pregnancy.plurality,
        chorionicity: pregnancy.chorionicity,
        status: pregnancy.status,
        highRiskFlags: pregnancy.highRiskFlags,
      },
      lastConsultations: lastConsultations.map((c) => ({
        date: c.date,
        gaDays: c.gestationalAgeDays,
        weightKg: c.weightKg,
        bpSystolic: c.bpSystolic,
        bpDiastolic: c.bpDiastolic,
        fundalHeightCm: c.fundalHeightCm,
        fetalHeartRate: c.fetalHeartRate,
        edemaGrade: c.edemaGrade,
        assessment: c.assessment,
      })),
      labAlerts: labAlerts.map((l) => ({
        examName: l.examName,
        category: l.examCategory,
        value: l.value,
        resultText: l.resultText,
        status: l.status,
        alertMessage: l.alertMessage,
      })),
      examSchedule: {
        overdueCount: examCheck.overdue.length,
        overdueExams: examCheck.overdue.map((e) => e.schedule.examName),
        pendingCount: examCheck.pending.length,
      },
    });

    const analysis = await this.callClaudeApi(clinicalContext);

    // Salvar alertas gerados pela IA
    const savedAlerts: CopilotAlert[] = [];
    for (const alert of analysis.alerts) {
      const entity = this.alertRepo.create({
        pregnancyId,
        alertType: (alert.type as AlertType) || AlertType.SUGGESTION,
        severity: (alert.severity as AlertSeverity) || AlertSeverity.INFO,
        title: alert.title,
        message: alert.message,
        recommendation: alert.recommendation,
        triggeredBy: 'ai_analysis',
        aiGenerated: true,
      });
      savedAlerts.push(await this.alertRepo.save(entity));
    }

    // Override riskLevel based on actual alert severities (AI may underestimate)
    let riskLevel = analysis.riskLevel ?? 'low';
    const hasCritical = savedAlerts.some((a) => a.severity === 'critical' || a.alertType === 'red_flag');
    const hasWarning = savedAlerts.some((a) => a.severity === 'warning');
    if (hasCritical) riskLevel = 'high';
    else if (hasWarning && riskLevel === 'low') riskLevel = 'moderate';

    return {
      riskLevel,
      suggestions: analysis.summary,
      summary: analysis.summary,
      alerts: savedAlerts,
      gestationalAge: ga,
    };
  }

  // ── Verificação de exames ──

  async checkExams(pregnancyId: string) {
    const examCheck = await this.clinicalProtocolsService.checkExamSchedule(pregnancyId);
    const savedAlerts: CopilotAlert[] = [];

    for (const item of examCheck.overdue) {
      const existing = await this.alertRepo.findOneBy({
        pregnancyId,
        triggeredBy: `exam_overdue:${item.schedule.examName}`,
        isResolved: false,
      });
      if (existing) continue;

      const alert = this.alertRepo.create({
        pregnancyId,
        alertType: AlertType.EXAM_OVERDUE,
        severity: AlertSeverity.WARNING,
        title: `Exame atrasado: ${item.schedule.examName}`,
        message: `O exame "${item.schedule.examName}" deveria ter sido solicitado entre ${item.schedule.gaWeeksMin} e ${item.schedule.gaWeeksMax} semanas. A gestação atual está com ${examCheck.gaWeeks} semanas.`,
        recommendation: `Solicitar ${item.schedule.examName} com urgência.`,
        triggeredBy: `exam_overdue:${item.schedule.examName}`,
        aiGenerated: false,
      });
      savedAlerts.push(await this.alertRepo.save(alert));
    }

    for (const item of examCheck.pending) {
      if (examCheck.gaWeeks < item.schedule.gaWeeksMin) continue;

      const existing = await this.alertRepo.findOneBy({
        pregnancyId,
        triggeredBy: `exam_pending:${item.schedule.examName}`,
        isResolved: false,
      });
      if (existing) continue;

      const alert = this.alertRepo.create({
        pregnancyId,
        alertType: AlertType.SUGGESTION,
        severity: AlertSeverity.INFO,
        title: `Exame na janela ideal: ${item.schedule.examName}`,
        message: `O exame "${item.schedule.examName}" está na janela ideal de solicitação (${item.schedule.gaWeeksMin}-${item.schedule.gaWeeksMax} semanas). Semana ideal: ${item.schedule.gaWeeksIdeal}.`,
        recommendation: `Solicitar ${item.schedule.examName}.`,
        triggeredBy: `exam_pending:${item.schedule.examName}`,
        aiGenerated: false,
      });
      savedAlerts.push(await this.alertRepo.save(alert));
    }

    return { examCheck, newAlerts: savedAlerts };
  }

  // ── Detecção de padrões ──

  async detectPatterns(consultationId: string) {
    const consultation = await this.consultationsService.findOne(consultationId);
    const allConsultationsPage = await this.consultationsService.findAllByPregnancy(consultation.pregnancyId, 1, 500);
    const last3 = allConsultationsPage.data.slice(-3);
    const savedAlerts: CopilotAlert[] = [];
    const gaWeeks = Math.floor(consultation.gestationalAgeDays / 7);

    // PA elevação progressiva
    if (last3.length >= 3) {
      const systolicValues = last3
        .map((c) => c.bpSystolic)
        .filter((v): v is number => v != null);

      if (systolicValues.length >= 3) {
        const isRising = systolicValues.every((v, i) => i === 0 || v > systolicValues[i - 1]);
        const lastSystolic = systolicValues[systolicValues.length - 1];

        if (isRising && lastSystolic >= 130) {
          savedAlerts.push(await this.savePatternAlert(
            consultation.pregnancyId,
            consultationId,
            lastSystolic >= 140 ? AlertSeverity.URGENT : AlertSeverity.WARNING,
            'Tendência de elevação da PA',
            `Pressão arterial sistólica em elevação progressiva nas últimas 3 consultas: ${systolicValues.join(' → ')} mmHg.`,
            'Avaliar pré-eclâmpsia. Considerar proteinúria de 24h, relação proteína/creatinina e exames laboratoriais (plaquetas, TGO, TGP, LDH, ácido úrico).',
            'bp_systolic_trend',
          ));
        }
      }
    }

    // Ganho de peso excessivo
    if (last3.length >= 2) {
      const withWeight = last3
        .filter((c) => c.weightKg != null)
        .map((c) => ({ date: new Date(c.date), weight: Number(c.weightKg) }));

      if (withWeight.length >= 2) {
        const latest = withWeight[withWeight.length - 1];
        const previous = withWeight[withWeight.length - 2];
        const daysDiff = (latest.date.getTime() - previous.date.getTime()) / 86_400_000;

        if (daysDiff > 0) {
          const weeklyGain = ((latest.weight - previous.weight) / daysDiff) * 7;
          if (weeklyGain > 0.5) {
            savedAlerts.push(await this.savePatternAlert(
              consultation.pregnancyId,
              consultationId,
              AlertSeverity.WARNING,
              'Ganho de peso excessivo',
              `Ganho de peso de ${(weeklyGain * 1000).toFixed(0)}g/semana (acima de 500g/semana). Peso anterior: ${previous.weight}kg, atual: ${latest.weight}kg.`,
              'Avaliar edema, PA e proteinúria. Orientar dieta e atividade física adequada. Considerar pré-eclâmpsia se associado a hipertensão.',
              'weight_gain_excessive',
            ));
          }
        }
      }
    }

    // AU menor que esperada para IG (possível FGR)
    if (consultation.fundalHeightCm != null && gaWeeks >= 20) {
      const expectedAU = gaWeeks; // Regra de McDonald: AU ≈ IG em semanas (±3cm)
      const fundalHeight = Number(consultation.fundalHeightCm);
      if (fundalHeight < expectedAU - 3) {
        savedAlerts.push(await this.savePatternAlert(
          consultation.pregnancyId,
          consultationId,
          AlertSeverity.URGENT,
          'Altura uterina abaixo do esperado',
          `AU de ${fundalHeight}cm com ${gaWeeks} semanas de IG. Esperado: ${expectedAU}±3cm. Possível restrição de crescimento fetal (FGR).`,
          'Solicitar ultrassom obstétrico com Doppler para avaliação de crescimento fetal e perfusão placentária.',
          'fundal_height_low',
        ));
      }
    }

    // BCF fora do range 110-160 bpm
    if (consultation.fetalHeartRate != null) {
      const fhr = consultation.fetalHeartRate;
      if (fhr < 110 || fhr > 160) {
        savedAlerts.push(await this.savePatternAlert(
          consultation.pregnancyId,
          consultationId,
          AlertSeverity.URGENT,
          fhr < 110 ? 'Bradicardia fetal' : 'Taquicardia fetal',
          `BCF de ${fhr} bpm (range normal: 110-160 bpm).`,
          fhr < 110
            ? 'Avaliar vitalidade fetal com cardiotocografia. Investigar causas: hipóxia, bloqueio cardíaco, medicamentos.'
            : 'Avaliar vitalidade fetal. Investigar causas: infecção materna, febre, hipertireoidismo, taquiarritmia fetal.',
          'fetal_heart_rate_abnormal',
        ));
      }
    }

    return savedAlerts;
  }

  // ── CRUD de alertas ──

  async findAlerts(pregnancyId: string, severity?: AlertSeverity): Promise<CopilotAlert[]> {
    const where: Record<string, unknown> = { pregnancyId };
    if (severity) where.severity = severity;
    return this.alertRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneAlert(id: string): Promise<CopilotAlert> {
    const alert = await this.alertRepo.findOneBy({ id });
    if (!alert) throw new NotFoundException(`Alerta ${id} nao encontrado`);
    return alert;
  }

  async markAsRead(id: string): Promise<CopilotAlert> {
    const alert = await this.findOneAlert(id);
    alert.isRead = true;
    return this.alertRepo.save(alert);
  }

  async markAsResolved(id: string): Promise<CopilotAlert> {
    const alert = await this.findOneAlert(id);
    alert.isResolved = true;
    return this.alertRepo.save(alert);
  }

  // ── Privados ──

  private async callClaudeApi(clinicalContext: string): Promise<AiAnalysisResult> {
    try {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        this.logger.error('ANTHROPIC_API_KEY não configurada. Verifique o arquivo .env');
        return {
          alerts: [],
          riskLevel: 'unknown',
          summary: 'API key não configurada. Verifique a variável ANTHROPIC_API_KEY no .env.',
        };
      }

      const response = await this.getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Analise os seguintes dados clínicos da gestação:\n\n${clinicalContext}` },
        ],
      });

      const rawText = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      const cleanJson = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanJson) as AiAnalysisResult;
    } catch (error) {
      const err = error as Error & { status?: number; message?: string };
      this.logger.error(
        `Erro na chamada à Claude API: [${err.status ?? 'N/A'}] ${err.message}`,
        err.stack,
      );
      return {
        alerts: [],
        riskLevel: 'unknown',
        summary: `Não foi possível realizar a análise por IA: ${err.message}`,
      };
    }
  }

  private async savePatternAlert(
    pregnancyId: string,
    consultationId: string,
    severity: AlertSeverity,
    title: string,
    message: string,
    recommendation: string,
    triggeredBy: string,
  ): Promise<CopilotAlert> {
    const alert = this.alertRepo.create({
      pregnancyId,
      consultationId,
      alertType: AlertType.PATTERN_DETECTED,
      severity,
      title,
      message,
      recommendation,
      triggeredBy,
      aiGenerated: false,
    });
    return this.alertRepo.save(alert);
  }
}
