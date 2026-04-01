import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { UltrasoundSummary } from './ultrasound-summary.entity.js';
import {
  SummaryExamType,
  SummaryReportStatus,
  MORPHO_1ST_FINDINGS,
  MORPHO_2ND_FINDINGS,
  ECHO_FINDINGS,
} from './ultrasound-summary.enums.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { CreateUltrasoundSummaryDto } from './dto/create-ultrasound-summary.dto.js';
import { UpdateUltrasoundSummaryDto } from './dto/update-ultrasound-summary.dto.js';

const EXTRACT_SYSTEM_PROMPT = `Você é um assistente médico especializado em ultrassonografia obstétrica. Analise o laudo de ultrassom fornecido e extraia os dados estruturados.

Retorne APENAS um JSON válido com a estrutura abaixo (omita campos ausentes no laudo):

{
  "fetalWeightGrams": number | null,
  "fetalWeightPercentile": number | null,
  "generalObservations": "resumo da conclusão",
  "specificFindings": {
    // Para morfológico 1º trimestre:
    "dopplerResult": "normal" | "altered",
    "trisomyRisk": { "t21": { "risk": "1:XXXX", "category": "low|intermediate|high" }, "t18": {...}, "t13": {...} },
    "preeclampsiaRisk": { "risk": "1:XX", "category": "low|intermediate|high" },
    "morphologyResult": "normal" | "altered",
    "morphologyFindings": { "items": ["achado1", "achado2"], "freeText": "observação livre" },
    // Para morfológico 2º trimestre:
    "cervicalLength": number,
    "cervicalLengthCategory": "short" | "normal",
    "funneling": "present" | "absent",
    "sludge": "present" | "absent",
    "ege": "present" | "absent",
    // Para ecodoppler:
    "echoResult": "normal" | "altered",
    "echoFindings": { "items": ["achado1"], "freeText": "..." }
  },
  "alertTriggered": boolean,
  "alertMessage": "mensagem se houver achado crítico"
}

Classifique riscos: low (<1:1000), intermediate (1:101-1:1000), high (>=1:100).
Colo curto: <=25mm. Gere alerta para achados alterados ou riscos altos.`;

@Injectable()
export class UltrasoundSummaryService {
  private readonly logger = new Logger(UltrasoundSummaryService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(UltrasoundSummary)
    private readonly repo: Repository<UltrasoundSummary>,
    private readonly pregnanciesService: PregnanciesService,
    private readonly configService: ConfigService,
  ) {}

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
      });
    }
    return this.anthropicClient;
  }

  // ── CRUD ──

  async create(pregnancyId: string, dto: CreateUltrasoundSummaryDto): Promise<UltrasoundSummary> {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy, new Date(dto.examDate));

    const { specificFindings: explicit, ...rest } = this.mergeSpecificFindings(dto);

    const summary = this.repo.create({
      ...rest,
      pregnancyId,
      gestationalAgeDays: ga.totalDays,
      specificFindings: explicit,
    });

    this.evaluateAlerts(summary);
    return this.repo.save(summary);
  }

  async findAllByPregnancy(pregnancyId: string): Promise<UltrasoundSummary[]> {
    return this.repo.find({
      where: { pregnancyId },
      order: { examDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UltrasoundSummary> {
    const summary = await this.repo.findOneBy({ id });
    if (!summary) throw new NotFoundException(`Resumo de USG ${id} nao encontrado`);
    return summary;
  }

  async update(id: string, dto: UpdateUltrasoundSummaryDto): Promise<UltrasoundSummary> {
    const summary = await this.findOne(id);
    const { specificFindings: merged, ...rest } = this.mergeSpecificFindings(dto);

    Object.assign(summary, rest);
    if (merged) {
      summary.specificFindings = { ...(summary.specificFindings as Record<string, unknown> ?? {}), ...merged };
    }
    this.evaluateAlerts(summary);
    return this.repo.save(summary);
  }

  // ── Extração por IA ──

  async extractFromAi(id: string): Promise<UltrasoundSummary> {
    const summary = await this.findOne(id);

    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.error('ANTHROPIC_API_KEY nao configurada');
      return summary;
    }

    const context = JSON.stringify({
      examType: summary.examType,
      examDate: summary.examDate,
      gestationalAgeDays: summary.gestationalAgeDays,
      generalObservations: summary.generalObservations,
      currentFindings: summary.specificFindings,
      attachmentUrl: summary.attachmentUrl,
    });

    try {
      const response = await this.getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: EXTRACT_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Extraia os dados estruturados do seguinte laudo de ultrassom obstétrico (tipo: ${summary.examType}):\n\n${context}` },
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

      const extracted = JSON.parse(cleanJson);

      // Preencher campos extraídos
      if (extracted.fetalWeightGrams != null) summary.fetalWeightGrams = extracted.fetalWeightGrams;
      if (extracted.fetalWeightPercentile != null) summary.fetalWeightPercentile = extracted.fetalWeightPercentile;
      if (extracted.generalObservations) summary.generalObservations = extracted.generalObservations;
      if (extracted.specificFindings) summary.specificFindings = extracted.specificFindings;
      if (extracted.alertTriggered != null) summary.alertTriggered = extracted.alertTriggered;
      if (extracted.alertMessage) summary.alertMessage = extracted.alertMessage;

      summary.aiExtractedData = extracted;
      summary.reportStatus = SummaryReportStatus.SUMMARIZED;

      this.evaluateAlerts(summary);
      return this.repo.save(summary);
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.error(`Erro na extração por IA: [${err.status ?? 'N/A'}] ${err.message}`, err.stack);
      return summary;
    }
  }

  // ── Mesclar campos específicos no specificFindings ──

  private mergeSpecificFindings<T extends Partial<CreateUltrasoundSummaryDto>>(dto: T) {
    const SPECIFIC_KEYS = [
      'dopplerResult', 'trisomyRisk', 'preeclampsiaRisk',
      'morphologyResult', 'morphologyFindings',
      'cervicalLength', 'cervicalLengthCategory', 'funneling', 'sludge', 'ege',
      'echoResult', 'echoFindings',
    ] as const;

    const specificFromDto: Record<string, unknown> = {};
    const rest: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      if ((SPECIFIC_KEYS as readonly string[]).includes(key)) {
        specificFromDto[key] = value;
      } else {
        rest[key] = value;
      }
    }

    const existing = (rest.specificFindings ?? {}) as Record<string, unknown>;
    const merged = Object.keys(specificFromDto).length > 0
      ? { ...existing, ...specificFromDto }
      : Object.keys(existing).length > 0 ? existing : null;

    rest.specificFindings = merged;
    return rest as Omit<T, typeof SPECIFIC_KEYS[number]> & { specificFindings: Record<string, unknown> | null };
  }

  // ── Alertas automáticos ──

  private evaluateAlerts(summary: UltrasoundSummary): void {
    const findings = summary.specificFindings as Record<string, unknown> | null;
    if (!findings) return;

    const alerts: string[] = [];

    // Morfológico 1º tri — riscos de trissomia
    if (summary.examType === SummaryExamType.MORPHOLOGICAL_1ST) {
      const trisomyRisk = findings.trisomyRisk as Record<string, { category?: string }> | undefined;
      if (trisomyRisk) {
        for (const [key, val] of Object.entries(trisomyRisk)) {
          if (val.category === 'high') {
            alerts.push(`Risco alto de ${key.toUpperCase()}: ${(val as any).risk}`);
          }
        }
      }
      const peRisk = findings.preeclampsiaRisk as { category?: string; risk?: string } | undefined;
      if (peRisk?.category === 'high') {
        alerts.push(`Risco alto de pré-eclâmpsia: ${peRisk.risk}`);
      }
      if (findings.morphologyResult === 'altered') {
        alerts.push('Morfologia de 1º trimestre alterada');
      }
    }

    // Morfológico 2º tri — colo curto
    if (summary.examType === SummaryExamType.MORPHOLOGICAL_2ND) {
      if (findings.cervicalLengthCategory === 'short') {
        alerts.push(`Colo uterino curto: ${findings.cervicalLength}mm`);
      }
      if (findings.funneling === 'present') {
        alerts.push('Afunilamento cervical presente');
      }
      if (findings.morphologyResult === 'altered') {
        alerts.push('Morfologia de 2º trimestre alterada');
      }
    }

    // Ecodoppler — achados
    if (summary.examType === SummaryExamType.ECHODOPPLER) {
      if (findings.echoResult === 'altered') {
        alerts.push('Ecocardiografia fetal alterada');
      }
    }

    // Peso fetal < p10
    if (summary.fetalWeightPercentile != null && Number(summary.fetalWeightPercentile) < 10) {
      alerts.push(`Peso fetal estimado no percentil ${summary.fetalWeightPercentile} (abaixo do p10)`);
    }

    if (alerts.length > 0) {
      summary.alertTriggered = true;
      summary.alertMessage = alerts.join('; ');
    }
  }
}
