import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenopauseAssessment } from './menopause-assessment.entity.js';
import { CreateMenopauseAssessmentDto } from './dto/create-menopause-assessment.dto.js';
import { UpdateMenopauseAssessmentDto } from './dto/update-menopause-assessment.dto.js';
import {
  MenopauseAlert,
  OsteoporosisClassification,
  HRTScheme,
  MenopauseType,
} from './menopause-assessment.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

const MRS_FIELDS = [
  'mrsHotFlashes',
  'mrsHeartPalpitations',
  'mrsSleepDisorders',
  'mrsJointMuscleDiscomfort',
  'mrsDepressiveMood',
  'mrsIrritability',
  'mrsAnxiety',
  'mrsPhysicalMentalExhaustion',
  'mrsSexualProblems',
  'mrsBladderProblems',
  'mrsDrynessVagina',
] as const;

@Injectable()
export class MenopauseAssessmentsService {
  constructor(
    @InjectRepository(MenopauseAssessment)
    private readonly repo: Repository<MenopauseAssessment>,
  ) {}

  async create(
    patientId: string,
    dto: CreateMenopauseAssessmentDto,
    tenantId: string | null,
  ): Promise<MenopauseAssessment> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const assessment = this.repo.create({ ...dto, patientId, tenantId });
    this.computeMrsTotal(assessment);
    this.classifyOsteoporosis(assessment);
    this.evaluateAlerts(assessment);
    return this.repo.save(assessment);
  }

  async findAllByPatient(
    patientId: string,
    tenantId: string | null,
    page = 1,
    limit = 50,
  ) {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { assessmentDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLatest(
    patientId: string,
    tenantId: string | null,
  ): Promise<MenopauseAssessment | null> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.findOne({ where, order: { assessmentDate: 'DESC' } });
  }

  async findOne(id: string, tenantId: string | null): Promise<MenopauseAssessment> {
    const a = await this.repo.findOneBy({ id });
    if (!a) throw new NotFoundException(`Avaliação climatérica ${id} nao encontrada`);
    if (tenantId && a.tenantId && a.tenantId !== tenantId) {
      throw new NotFoundException(`Avaliação climatérica ${id} nao encontrada`);
    }
    return a;
  }

  async update(
    id: string,
    dto: UpdateMenopauseAssessmentDto,
    tenantId: string | null,
  ): Promise<MenopauseAssessment> {
    const assessment = await this.findOne(id, tenantId);
    Object.assign(assessment, dto);
    this.computeMrsTotal(assessment);
    this.classifyOsteoporosis(assessment);
    this.evaluateAlerts(assessment);
    return this.repo.save(assessment);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const assessment = await this.findOne(id, tenantId);
    await this.repo.remove(assessment);
  }

  // ── Cálculo automático MRS total (soma dos 11 itens) ──
  private computeMrsTotal(a: MenopauseAssessment): void {
    let sum = 0;
    let hasAny = false;
    for (const field of MRS_FIELDS) {
      const v = a[field];
      if (v !== null && v !== undefined) {
        sum += Number(v);
        hasAny = true;
      }
    }
    a.mrsTotalScore = hasAny ? sum : null;
  }

  // ── Classificação automática de osteoporose pelo menor T-score ──
  private classifyOsteoporosis(a: MenopauseAssessment): void {
    const scores = [
      a.dexaLumbarTScore,
      a.dexaFemoralNeckTScore,
      a.dexaTotalHipTScore,
    ]
      .filter((v) => v !== null && v !== undefined)
      .map((v) => Number(v));

    if (scores.length === 0) return;

    const lowest = Math.min(...scores);
    if (lowest > -1) {
      a.osteoporosisClassification = OsteoporosisClassification.NORMAL;
    } else if (lowest > -2.5) {
      a.osteoporosisClassification = OsteoporosisClassification.OSTEOPENIA;
    } else {
      // Sem informação de fratura prévia → classifica como OSTEOPOROSIS;
      // SEVERE_OSTEOPOROSIS deve ser atribuído manualmente quando há fratura.
      if (a.osteoporosisClassification !== OsteoporosisClassification.SEVERE_OSTEOPOROSIS) {
        a.osteoporosisClassification = OsteoporosisClassification.OSTEOPOROSIS;
      }
    }
  }

  // ── Copiloto: regras NAMS / FEBRASGO ──
  private evaluateAlerts(a: MenopauseAssessment): void {
    const alerts: MenopauseAlert[] = [];

    // MRS total — gravidade dos sintomas
    if (a.mrsTotalScore !== null) {
      const score = a.mrsTotalScore;
      if (score >= 17) {
        alerts.push({
          type: 'mrs_severe',
          message: `MRS ${score} — sintomas climatéricos severos, considerar tratamento`,
          severity: 'warning',
        });
      } else if (score >= 9) {
        alerts.push({
          type: 'mrs_moderate',
          message: `MRS ${score} — sintomas moderados`,
          severity: 'info',
        });
      }
    }

    // POI (insuficiência ovariana prematura)
    if (a.menopauseType === MenopauseType.PREMATURE_OVARIAN_INSUFFICIENCY) {
      alerts.push({
        type: 'poi',
        message: 'Insuficiência ovariana prematura — THM até idade fisiológica da menopausa (≈51 anos)',
        severity: 'warning',
      });
    }

    // Menopausa precoce (< 45 anos)
    if (a.ageAtMenopause !== null && (a.ageAtMenopause ?? 99) < 45) {
      alerts.push({
        type: 'early_menopause',
        message: `Menopausa precoce (${a.ageAtMenopause} anos) — risco cardiovascular e ósseo aumentado`,
        severity: 'warning',
      });
    }

    // Osteoporose / osteopenia
    if (a.osteoporosisClassification === OsteoporosisClassification.OSTEOPOROSIS) {
      alerts.push({
        type: 'osteoporosis',
        message: 'Osteoporose densitométrica — iniciar tratamento específico (bisfosfonato/denosumabe)',
        severity: 'urgent',
      });
    } else if (a.osteoporosisClassification === OsteoporosisClassification.SEVERE_OSTEOPOROSIS) {
      alerts.push({
        type: 'severe_osteoporosis',
        message: 'Osteoporose grave (com fratura) — referência à reumatologia, considerar teriparatida',
        severity: 'urgent',
      });
    } else if (a.osteoporosisClassification === OsteoporosisClassification.OSTEOPENIA) {
      alerts.push({
        type: 'osteopenia',
        message: 'Osteopenia — otimizar cálcio/vitamina D, exercício resistido, repetir DEXA em 2 anos',
        severity: 'info',
      });
    }

    // FRAX alto risco
    if (a.fraxScore10yrMajor !== null && Number(a.fraxScore10yrMajor ?? 0) >= 20) {
      alerts.push({
        type: 'frax_high_major',
        message: `FRAX fratura major ${a.fraxScore10yrMajor}% (≥20%) — alto risco`,
        severity: 'urgent',
      });
    }
    if (a.fraxScore10yrHip !== null && Number(a.fraxScore10yrHip ?? 0) >= 3) {
      alerts.push({
        type: 'frax_high_hip',
        message: `FRAX fratura quadril ${a.fraxScore10yrHip}% (≥3%) — alto risco`,
        severity: 'urgent',
      });
    }

    // Vitamina D baixa
    if (a.vitaminDLevel !== null && Number(a.vitaminDLevel ?? 0) < 20) {
      alerts.push({
        type: 'vitamin_d_deficient',
        message: `Vitamina D ${a.vitaminDLevel} ng/mL — deficiência (<20)`,
        severity: 'warning',
      });
    } else if (a.vitaminDLevel !== null && Number(a.vitaminDLevel ?? 0) < 30) {
      alerts.push({
        type: 'vitamin_d_insufficient',
        message: `Vitamina D ${a.vitaminDLevel} ng/mL — insuficiência (20-30)`,
        severity: 'info',
      });
    }

    // GSM
    if (a.gsmDiagnosis) {
      alerts.push({
        type: 'gsm',
        message: 'Síndrome geniturinária — estrogênio vaginal local é primeira linha',
        severity: 'info',
      });
    }
    if (a.phMeterResult !== null && Number(a.phMeterResult ?? 0) > 4.5) {
      alerts.push({
        type: 'vaginal_ph_elevated',
        message: `pH vaginal ${a.phMeterResult} — compatível com atrofia/GSM`,
        severity: 'info',
      });
    }

    // Cognitivo
    if (a.mmsScore !== null && (a.mmsScore ?? 30) < 24) {
      alerts.push({
        type: 'mms_low',
        message: `MMSE ${a.mmsScore} — investigar declínio cognitivo`,
        severity: 'warning',
      });
    }
    if (a.mocaScore !== null && (a.mocaScore ?? 30) < 26) {
      alerts.push({
        type: 'moca_low',
        message: `MoCA ${a.mocaScore} — investigar comprometimento cognitivo leve`,
        severity: 'warning',
      });
    }

    // Risco cardiovascular alto + THM oral → preferir transdérmico
    if (
      a.cardioRiskCategory === 'high' &&
      a.hrtScheme &&
      a.hrtScheme !== HRTScheme.NONE &&
      a.estrogenRoute === 'oral'
    ) {
      alerts.push({
        type: 'hrt_route_cv_risk',
        message: 'THM oral em paciente de alto risco CV — preferir via transdérmica',
        severity: 'warning',
      });
    }

    // THM contraindicada mas indicada
    if (a.hrtIndicated && a.hrtContraindicated) {
      alerts.push({
        type: 'hrt_conflict',
        message: 'THM indicada mas contraindicada — discutir alternativas não-hormonais',
        severity: 'warning',
      });
    }

    // Esquema de THM com útero presente sem progesterona → risco endometrial
    if (
      a.hrtScheme === HRTScheme.ESTROGEN_ONLY &&
      a.menopauseType !== MenopauseType.SURGICAL
    ) {
      alerts.push({
        type: 'unopposed_estrogen',
        message: 'Estrogênio sem progesterona em paciente com útero — risco de hiperplasia/câncer endometrial',
        severity: 'urgent',
      });
    }

    // Mamografia em atraso
    if (a.nextMammographyDate) {
      const next = new Date(a.nextMammographyDate);
      const today = new Date(a.assessmentDate);
      if (next < today) {
        alerts.push({
          type: 'mammography_overdue',
          message: 'Mamografia em atraso — solicitar',
          severity: 'warning',
        });
      }
    }

    a.alerts = alerts.length > 0 ? alerts : null;
  }
}
