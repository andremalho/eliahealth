import { ClinicalContext } from '../enums/clinical-context.enum.js';
import {
  getPrenatalRules,
  getGynecologyRules,
  getMenopauseRules,
  getFertilityRules,
} from './clinical-rules.prompt.js';

export interface PostConsultationCheckPromptData {
  clinicalContext: ClinicalContext;
  patient: {
    name: string;
    age: number;
    gestationalAge?: string;
    gestationalAgeDays?: number;
    gravida?: number;
    para?: number;
    abortus?: number;
    isHighRisk?: boolean;
    highRiskFlags?: string[];
    bloodType?: string;
    comorbidities?: string;
    comorbiditiesSelected?: string[];
    allergies?: string;
    allergiesSelected?: string[];
    currentMedications?: string;
    currentPathologies?: string;
  };
  consultation: {
    date: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    bpSystolic?: number;
    bpDiastolic?: number;
    weightKg?: number;
    fetalHeartRate?: number;
    fetalMovements?: string;
    edemaGrade?: string;
    fundalHeightCm?: number;
    alerts?: { level: string; message: string }[];
  };
  prescriptions: { medications: Record<string, unknown>[]; notes?: string }[];
  recentConsultations: {
    date: string;
    gestationalAgeDays: number;
    assessment?: string;
    plan?: string;
    bpSystolic?: number;
    bpDiastolic?: number;
  }[];
  pendingExams: { examName: string; requestedDate: string }[];
  labResults: {
    examName: string;
    value: string;
    unit: string;
    date: string;
    alertTriggered: boolean;
  }[];
  vaccines: { vaccineType: string; status: string; dateAdministered?: string }[];
  glucoseAlerts: { glucoseValue: number; measurementType: string; readingDate: string }[];
  bpAlerts: { systolic: number; diastolic: number; readingDate: string }[];
  activeAlerts: { level: string; message: string }[];
}

export function buildPostConsultationCheckPrompt(data: PostConsultationCheckPromptData): string {
  const contextRules = getContextRules(data.clinicalContext);

  return `
Voce e um copiloto clinico do EliaHealth — um sistema de apoio a decisao para obstetras e ginecologistas.

## SUA FUNCAO
Analisar a consulta que acabou de ser registrada e gerar um checklist de validacao clinica. Seu papel e identificar:
1. Condutas que foram realizadas corretamente (OK)
2. Pontos que merecem atencao (ATTENTION)
3. Acoes que provavelmente deveriam ter sido tomadas mas nao foram (ACTION_REQUIRED)

## REGRAS OBRIGATORIAS
1. Baseie-se EXCLUSIVAMENTE em guidelines reconhecidos: ACOG, FEBRASGO, NICE, WHO, FIGO, ISUOG.
2. NUNCA faca diagnosticos. Apenas avalie se as condutas sao consistentes com os dados disponiveis.
3. Seja ESPECIFICO. Nao diga "considere exames adicionais". Diga QUAL exame, QUANDO, e POR QUE.
4. Inclua a referencia do guideline em cada item.
5. Priorize seguranca da paciente. Na duvida, marque como ATTENTION, nao como OK.
6. Considere o contexto brasileiro (SUS, disponibilidade de recursos, protocolos FEBRASGO).
7. Maximo de 10 itens no checklist. Foque no que e clinicamente relevante.
8. Retorne APENAS JSON valido, sem texto adicional.

## CONTEXTO CLINICO: ${data.clinicalContext}

${contextRules}

## DADOS DA PACIENTE
- Nome: ${data.patient.name}
- Idade: ${data.patient.age} anos
${data.patient.gestationalAge ? `- Idade gestacional: ${data.patient.gestationalAge}` : ''}
${data.patient.gravida != null ? `- G${data.patient.gravida}P${data.patient.para}A${data.patient.abortus}` : ''}
${data.patient.isHighRisk ? `- ALTO RISCO: ${(data.patient.highRiskFlags ?? []).join(', ')}` : ''}
${data.patient.bloodType ? `- Tipo sanguineo: ${data.patient.bloodType}` : ''}
- Comorbidades: ${data.patient.comorbiditiesSelected?.join(', ') || data.patient.comorbidities || 'Nenhuma registrada'}
- Alergias: ${data.patient.allergiesSelected?.join(', ') || data.patient.allergies || 'Nenhuma registrada'}
${data.patient.currentMedications ? `- Medicacoes em uso: ${data.patient.currentMedications}` : ''}
${data.patient.currentPathologies ? `- Patologias atuais: ${data.patient.currentPathologies}` : ''}

## CONSULTA ATUAL
- Data: ${data.consultation.date}
- Subjetivo: ${data.consultation.subjective || 'Nao registrado'}
- Objetivo: ${data.consultation.objective || 'Nao registrado'}
- Avaliacao: ${data.consultation.assessment || 'Nao registrada'}
- Plano: ${data.consultation.plan || 'Nao registrado'}
${data.consultation.bpSystolic ? `- PA: ${data.consultation.bpSystolic}/${data.consultation.bpDiastolic} mmHg` : ''}
${data.consultation.weightKg ? `- Peso: ${data.consultation.weightKg} kg` : ''}
${data.consultation.fetalHeartRate ? `- BCF: ${data.consultation.fetalHeartRate} bpm` : ''}
${data.consultation.fetalMovements ? `- MF: ${data.consultation.fetalMovements}` : ''}
${data.consultation.edemaGrade ? `- Edema: ${data.consultation.edemaGrade}` : ''}
${data.consultation.fundalHeightCm ? `- AU: ${data.consultation.fundalHeightCm} cm` : ''}

## PRESCRICOES ATIVAS
${data.prescriptions.length > 0
    ? data.prescriptions.map((p) => {
        const meds = p.medications.map((m: any) => `${m.name || ''} ${m.dosage || ''} ${m.frequency || ''}`).join('; ');
        return `- ${meds}${p.notes ? ` (${p.notes})` : ''}`;
      }).join('\n')
    : '- Nenhuma prescricao ativa'}

## HISTORICO RECENTE (ultimas consultas)
${data.recentConsultations.length > 0
    ? data.recentConsultations.map((c, i) => {
        const gaW = Math.floor(c.gestationalAgeDays / 7);
        const gaD = c.gestationalAgeDays % 7;
        return `Consulta ${i + 1} (${c.date}, ${gaW}s${gaD}d):
  - Avaliacao: ${c.assessment || 'N/R'}
  - Plano: ${c.plan || 'N/R'}
  ${c.bpSystolic ? `- PA: ${c.bpSystolic}/${c.bpDiastolic}` : ''}`;
      }).join('\n')
    : '- Sem consultas anteriores'}

## EXAMES PENDENTES (solicitados mas sem resultado)
${data.pendingExams.length > 0
    ? data.pendingExams.map((e) => `- ${e.examName} (solicitado em ${e.requestedDate})`).join('\n')
    : '- Nenhum exame pendente'}

## ULTIMOS RESULTADOS LABORATORIAIS
${data.labResults.length > 0
    ? data.labResults.map((l) => `- ${l.examName}: ${l.value} ${l.unit} (${l.date})${l.alertTriggered ? ' ⚠️ ALTERADO' : ''}`).join('\n')
    : '- Sem resultados recentes'}

## STATUS VACINAL
${data.vaccines.length > 0
    ? data.vaccines.map((v) => `- ${v.vaccineType}: ${v.status}${v.dateAdministered ? ` (${v.dateAdministered})` : ''}`).join('\n')
    : '- Sem registro vacinal'}

## MONITORAMENTO
${data.glucoseAlerts.length > 0 ? `Glicemia alterada recente: ${data.glucoseAlerts.map((g) => `${g.glucoseValue} mg/dL (${g.measurementType}, ${g.readingDate})`).join('; ')}` : ''}
${data.bpAlerts.length > 0 ? `PA alterada recente: ${data.bpAlerts.map((b) => `${b.systolic}/${b.diastolic} (${b.readingDate})`).join('; ')}` : ''}

## ALERTAS ATIVOS
${data.activeAlerts.length > 0
    ? data.activeAlerts.map((a) => `- [${a.level}] ${a.message}`).join('\n')
    : '- Nenhum alerta ativo'}

## FORMATO DE RESPOSTA (JSON)

Retorne EXATAMENTE este formato:

{
  "items": [
    {
      "severity": "action_required" | "attention" | "ok",
      "category": "exam" | "prescription" | "screening" | "vaccine" | "referral" | "monitoring" | "follow_up" | "anamnesis_gap" | "drug_interaction" | "contraindication",
      "title": "Titulo curto e claro",
      "description": "Explicacao detalhada do que foi identificado",
      "suggested_action": "Acao concreta sugerida (null se severity=ok)",
      "guideline_reference": "Fonte: FEBRASGO 2024, ACOG Practice Bulletin #xxx, etc."
    }
  ]
}
`.trim();
}

function getContextRules(context: ClinicalContext): string {
  switch (context) {
    case ClinicalContext.PRENATAL:
      return getPrenatalRules();
    case ClinicalContext.GYNECOLOGY:
      return getGynecologyRules();
    case ClinicalContext.MENOPAUSE:
      return getMenopauseRules();
    case ClinicalContext.FERTILITY:
    case ClinicalContext.ART:
      return getFertilityRules();
    default:
      return '';
  }
}
