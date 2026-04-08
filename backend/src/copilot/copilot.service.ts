import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
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
import { Patient } from '../patients/patient.entity.js';

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
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly configService: ConfigService,
    private readonly pregnanciesService: PregnanciesService,
    @Inject(forwardRef(() => ConsultationsService))
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

    // Detecta gaps de rastreio/profilaxia baseados em IG
    try {
      const gapAlerts = await this.detectPregnancyGaps(pregnancyId);
      savedAlerts.push(...gapAlerts);
    } catch (err) {
      this.logger.warn(`Falha ao detectar gaps: ${(err as Error).message}`);
    }

    // Override riskLevel based on actual alert severities (AI may underestimate)
    let riskLevel = analysis.riskLevel ?? 'low';
    const hasCritical = savedAlerts.some((a) => a.severity === 'critical' || a.alertType === 'red_flag');
    const hasWarning = savedAlerts.some((a) => a.severity === 'warning' || a.severity === 'urgent');
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

  // ── Deteccao de gaps de rastreio e profilaxia ──
  // Regras deterministicas baseadas em IG, exames, vacinas e fatores de risco
  async detectPregnancyGaps(pregnancyId: string): Promise<CopilotAlert[]> {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);
    const gaWeeks = ga.weeks;
    const patient = await this.patientRepo.findOneBy({ id: pregnancy.patientId });

    const savedAlerts: CopilotAlert[] = [];

    const hasActiveAlert = async (key: string): Promise<boolean> => {
      const existing = await this.alertRepo.findOne({
        where: { pregnancyId, triggeredBy: key, isRead: false },
      });
      return !!existing;
    };

    const createGap = async (
      severity: AlertSeverity,
      title: string,
      message: string,
      recommendation: string,
      key: string,
    ): Promise<CopilotAlert | null> => {
      if (await hasActiveAlert(key)) return null;
      const alert = this.alertRepo.create({
        pregnancyId,
        consultationId: null as any,
        alertType: AlertType.SUGGESTION,
        severity,
        title,
        message,
        recommendation,
        triggeredBy: key,
        aiGenerated: false,
      });
      return this.alertRepo.save(alert);
    };

    // 1. Rastreio DMG (24-28s)
    if (gaWeeks >= 24 && gaWeeks <= 28) {
      const [{ count }] = await this.alertRepo.query(
        `SELECT COUNT(*)::int AS count FROM lab_results
         WHERE pregnancy_id = $1
           AND (LOWER(exam_name) LIKE '%ttog%'
                OR LOWER(exam_name) LIKE '%glicemia%'
                OR LOWER(exam_name) LIKE '%glicose%'
                OR LOWER(exam_name) LIKE '%toleranc%')`,
        [pregnancyId],
      );
      if (count === 0) {
        const alert = await createGap(
          AlertSeverity.WARNING,
          'Rastreio de DMG pendente',
          `Paciente com ${gaWeeks} semanas. Rastreio de Diabetes Mellitus Gestacional não registrado nesta gestação.`,
          'Solicitar TTOG 75g (jejum, 1h e 2h). FEBRASGO/SBD recomendam rastreio universal entre 24-28 semanas.',
          'gap_dmg_screening',
        );
        if (alert) savedAlerts.push(alert);
      }
    }

    // 2. Profilaxia anti-RhD (>=28s, Rh negativo)
    const isRhNegative =
      patient?.bloodTypeRH === ('negative' as any) ||
      (patient?.bloodType ?? '').includes('-');
    if (gaWeeks >= 28 && isRhNegative) {
      const [{ count: labCount }] = await this.alertRepo.query(
        `SELECT COUNT(*)::int AS count FROM lab_results
         WHERE pregnancy_id = $1
           AND (LOWER(exam_name) LIKE '%coombs%'
                OR LOWER(exam_name) LIKE '%anti-rhd%'
                OR LOWER(exam_name) LIKE '%anti rh%')`,
        [pregnancyId],
      );
      const [{ count: vaccineCount }] = await this.alertRepo.query(
        `SELECT COUNT(*)::int AS count FROM vaccines
         WHERE pregnancy_id = $1
           AND (LOWER(vaccine_name) LIKE '%anti-rhd%'
                OR LOWER(vaccine_name) LIKE '%anti-d%'
                OR LOWER(vaccine_name) LIKE '%rhogam%'
                OR LOWER(vaccine_name) LIKE '%matergam%')`,
        [pregnancyId],
      );
      if (labCount === 0 && vaccineCount === 0) {
        const alert = await createGap(
          AlertSeverity.URGENT,
          'Profilaxia anti-RhD pendente',
          `Paciente Rh negativo com ${gaWeeks} semanas. Sem registro de Coombs indireto ou imunoglobulina anti-D.`,
          'Solicitar Coombs indireto. Se negativo, administrar imunoglobulina anti-D 300mcg IM em 28 semanas (profilaxia rotineira) e nas primeiras 72h pós-parto se RN Rh+.',
          'gap_anti_rhd',
        );
        if (alert) savedAlerts.push(alert);
      }
    }

    // 3. Prevencao pre-eclampsia com AAS (12-36s, com fatores de risco)
    if (gaWeeks >= 12 && gaWeeks <= 36) {
      const fatoresRisco: string[] = [];
      if (patient?.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000);
        if (age >= 35) fatoresRisco.push('idade ≥35 anos');
      }
      const heightCm = patient?.height ? Number(patient.height) : 0;
      if (heightCm > 0) {
        const [lastWeight] = await this.alertRepo.query(
          `SELECT weight_kg FROM consultations WHERE pregnancy_id = $1 AND weight_kg IS NOT NULL ORDER BY date DESC LIMIT 1`,
          [pregnancyId],
        );
        if (lastWeight?.weight_kg) {
          const bmi = Number(lastWeight.weight_kg) / Math.pow(heightCm / 100, 2);
          if (bmi >= 30) fatoresRisco.push(`IMC ${bmi.toFixed(1)} (obesidade)`);
        }
      }
      const path = (pregnancy.currentPathologies ?? '').toLowerCase();
      if (/hipertens/.test(path)) fatoresRisco.push('HAS prévia');
      if (/diabetes|dm[12]|lada|mody/.test(path)) fatoresRisco.push('Diabetes prévio');
      if (/renal/.test(path)) fatoresRisco.push('Doença renal');
      if (/autoimune|les|saf/.test(path)) fatoresRisco.push('Doença autoimune');
      if ((pregnancy.plurality ?? 1) > 1) fatoresRisco.push('gestação múltipla');
      if (/pré-eclâmpsia|pre-eclampsia|pré.eclâmpsia/i.test(pregnancy.previousPregnanciesNotes ?? '')) {
        fatoresRisco.push('PE em gestação anterior');
      }

      if (fatoresRisco.length >= 1) {
        const meds = (pregnancy.currentMedications ?? '').toLowerCase();
        const usandoAas = /\baas\b|acido acetil|aspirina/i.test(meds);
        if (!usandoAas) {
          const alert = await createGap(
            AlertSeverity.WARNING,
            'Profilaxia de pré-eclâmpsia com AAS',
            `Paciente com fator(es) de risco: ${fatoresRisco.join(', ')}. AAS não consta nas medicações em uso.`,
            'Considerar AAS 100-150mg/dia ao deitar entre 12-36 semanas (idealmente iniciar antes de 16s). Recomendação USPSTF/FIGO/FEBRASGO para pacientes de alto risco.',
            'gap_aas_pe',
          );
          if (alert) savedAlerts.push(alert);
        }
      }
    }

    // 4. Streptococcus B (35-37s)
    if (gaWeeks >= 35 && gaWeeks <= 37) {
      const [{ count }] = await this.alertRepo.query(
        `SELECT COUNT(*)::int AS count FROM vaginal_swabs
         WHERE pregnancy_id = $1
           AND (LOWER(exam_type) LIKE '%gbs%'
                OR LOWER(exam_type) LIKE '%streptococ%'
                OR LOWER(exam_type) LIKE '%grupo b%')`,
        [pregnancyId],
      );
      if (count === 0) {
        const alert = await createGap(
          AlertSeverity.WARNING,
          'Pesquisa de Streptococcus do grupo B pendente',
          `Paciente com ${gaWeeks} semanas. Sem registro de pesquisa de GBS.`,
          'Coletar swab vaginal e retal para cultura de Streptococcus do grupo B entre 35-37 semanas. Resultado positivo indica antibioticoprofilaxia intraparto.',
          'gap_gbs',
        );
        if (alert) savedAlerts.push(alert);
      }
    }

    // 5. Vacina dTpa (20-36s)
    if (gaWeeks >= 20 && gaWeeks <= 36) {
      const [{ count }] = await this.alertRepo.query(
        `SELECT COUNT(*)::int AS count FROM vaccines
         WHERE pregnancy_id = $1
           AND (LOWER(vaccine_name) LIKE '%dtpa%' OR vaccine_type = 'dtpa')
           AND status = 'administered'`,
        [pregnancyId],
      );
      if (count === 0) {
        const alert = await createGap(
          AlertSeverity.INFO,
          'Vacina dTpa pendente',
          `Paciente com ${gaWeeks} semanas. dTpa não foi administrada nesta gestação.`,
          'Administrar dTpa entre 20-36 semanas (idealmente 27-36s) em todas as gestações para proteção do recém-nascido contra coqueluche.',
          'gap_dtpa',
        );
        if (alert) savedAlerts.push(alert);
      }
    }

    // 6. Vacina VRS / Abrysvo (32-36s)
    if (gaWeeks >= 32 && gaWeeks <= 36) {
      const [{ count }] = await this.alertRepo.query(
        `SELECT COUNT(*)::int AS count FROM vaccines
         WHERE pregnancy_id = $1
           AND (LOWER(vaccine_name) LIKE '%vrs%'
                OR LOWER(vaccine_name) LIKE '%rsv%'
                OR LOWER(vaccine_name) LIKE '%abrysvo%'
                OR vaccine_type = 'rsv')
           AND status = 'administered'`,
        [pregnancyId],
      );
      if (count === 0) {
        const alert = await createGap(
          AlertSeverity.INFO,
          'Vacina VRS (Abrysvo) pendente',
          `Paciente com ${gaWeeks} semanas. VRS (vacina contra vírus sincicial respiratório) não foi administrada.`,
          'Administrar Abrysvo entre 32-36 semanas para proteção do RN contra bronquiolite por VRS. Janela recomendada estreita.',
          'gap_vrs',
        );
        if (alert) savedAlerts.push(alert);
      }
    }

    return savedAlerts;
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

    // IMC — calcula a partir do peso da consulta + altura do patient
    if (consultation.weightKg != null) {
      const pregnancy = await this.pregnanciesService.findOne(consultation.pregnancyId);
      const patient = await this.patientRepo.findOneBy({ id: pregnancy.patientId });
      if (patient?.height) {
        const heightM = Number(patient.height) / 100;
        const bmi = Number(consultation.weightKg) / (heightM * heightM);
        const bmiRounded = Math.round(bmi * 10) / 10;

        const existingBmiAlerts = await this.alertRepo.find({
          where: { pregnancyId: consultation.pregnancyId, triggeredBy: 'bmi' },
        });

        if (existingBmiAlerts.length === 0) {
          let severity: AlertSeverity | null = null;
          let title = '';
          let recommendation = '';

          if (bmi < 18.5) {
            severity = AlertSeverity.WARNING;
            title = 'IMC baixo (baixo peso)';
            recommendation = 'Avaliar nutricao. Risco aumentado de RCIU e parto pre-termo. Considerar acompanhamento nutricional.';
          } else if (bmi >= 25 && bmi < 30) {
            severity = AlertSeverity.INFO;
            title = 'IMC elevado (sobrepeso)';
            recommendation = 'Orientar dieta balanceada e atividade fisica adequada para gestacao. Monitorar ganho ponderal.';
          } else if (bmi >= 30 && bmi < 40) {
            severity = AlertSeverity.WARNING;
            title = 'IMC elevado (obesidade)';
            recommendation = 'Risco aumentado de DMG, pre-eclampsia e macrossomia. Acompanhamento nutricional. Considerar TTOG precoce.';
          } else if (bmi >= 40) {
            severity = AlertSeverity.URGENT;
            title = 'IMC muito elevado (obesidade grave)';
            recommendation = 'Alto risco materno-fetal. Acompanhamento multidisciplinar. TTOG precoce. Vigilancia rigorosa de PA e ganho ponderal.';
          }

          if (severity) {
            savedAlerts.push(await this.savePatternAlert(
              consultation.pregnancyId,
              consultationId,
              severity,
              title,
              `IMC calculado: ${bmiRounded} kg/m² (peso ${consultation.weightKg}kg / altura ${patient.height}cm).`,
              recommendation,
              'bmi',
            ));
          }
        }
      }
    }

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

    // Movimentos fetais ausentes — red flag clássica do pré-natal
    if (consultation.fetalMovements && /ausent/i.test(consultation.fetalMovements) && gaWeeks >= 20) {
      savedAlerts.push(await this.savePatternAlert(
        consultation.pregnancyId,
        consultationId,
        AlertSeverity.CRITICAL,
        'Movimentos fetais ausentes',
        `Paciente refere ausência de movimentos fetais com ${gaWeeks} semanas de IG.`,
        'Avaliação imediata da vitalidade fetal: ausculta de BCF, cardiotocografia e/ou ultrassom obstétrico com perfil biofísico fetal. Considerar internação se confirmada redução/ausência de movimentação.',
        'fetal_movement_absent',
      ));
    }

    // Movimentos fetais hipoativos — atenção
    if (consultation.fetalMovements && /hipoativ/i.test(consultation.fetalMovements) && gaWeeks >= 20) {
      savedAlerts.push(await this.savePatternAlert(
        consultation.pregnancyId,
        consultationId,
        AlertSeverity.WARNING,
        'Movimentos fetais hipoativos',
        `Paciente refere movimentos fetais hipoativos com ${gaWeeks} semanas de IG.`,
        'Orientar mobilograma. Reavaliar em curto prazo. Considerar cardiotocografia se persistir.',
        'fetal_movement_reduced',
      ));
    }

    // Apresentacao fetal nao cefalica >= 35 semanas
    if (
      gaWeeks >= 35 &&
      consultation.fetalPresentation &&
      (consultation.fetalPresentation === 'pelvic' || consultation.fetalPresentation === 'transverse')
    ) {
      const presentLabel = consultation.fetalPresentation === 'pelvic' ? 'pélvica' : 'transversa';
      savedAlerts.push(await this.savePatternAlert(
        consultation.pregnancyId,
        consultationId,
        AlertSeverity.WARNING,
        `Apresentação ${presentLabel} no terceiro trimestre`,
        `Feto em apresentação ${presentLabel} com ${gaWeeks} semanas de IG.`,
        'Considerar versão cefálica externa entre 36-37 semanas se ausência de contraindicações. Avaliar via de parto. Documentar discussão de riscos com a paciente.',
        'fetal_presentation_non_cephalic',
      ));
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
