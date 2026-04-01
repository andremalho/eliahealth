import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { GeneticCounseling } from './genetic-counseling.entity.js';
import { CreateGeneticCounselingDto } from './dto/create-genetic-counseling.dto.js';
import { UpdateGeneticCounselingDto } from './dto/update-genetic-counseling.dto.js';

const GENETICS_SYSTEM_PROMPT = `Você é um geneticista clínico especializado em medicina fetal e diagnóstico pré-natal. Analise os resultados genéticos fornecidos e gere uma interpretação clínica integrada.

Considere:
- Correlação entre NIPT, cariótipo, microarray e exoma quando disponíveis
- Significado clínico das variantes encontradas (patogênicas, VUS, benignas)
- Implicações para o prognóstico fetal
- Limitações de cada método diagnóstico
- Recomendações de acompanhamento baseadas nos achados

Retorne um texto em português médico formal com:
1. Resumo dos exames realizados e resultados
2. Interpretação integrada dos achados
3. Correlação com achados ultrassonográficos (quando disponíveis)
4. Prognóstico e implicações clínicas
5. Recomendações de conduta e seguimento

Seja preciso, baseado em evidências e sensível ao contexto emocional do aconselhamento genético.`;

@Injectable()
export class GeneticCounselingService {
  private readonly logger = new Logger(GeneticCounselingService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(GeneticCounseling)
    private readonly repo: Repository<GeneticCounseling>,
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

  async create(pregnancyId: string, dto: CreateGeneticCounselingDto): Promise<GeneticCounseling> {
    const record = this.repo.create({ ...dto, pregnancyId });
    return this.repo.save(record);
  }

  async findAllByPregnancy(pregnancyId: string): Promise<GeneticCounseling[]> {
    return this.repo.find({
      where: { pregnancyId },
      order: { counselingDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GeneticCounseling> {
    const record = await this.repo.findOneBy({ id });
    if (!record) throw new NotFoundException(`Aconselhamento genetico ${id} nao encontrado`);
    return record;
  }

  async update(id: string, dto: UpdateGeneticCounselingDto): Promise<GeneticCounseling> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  // ── Interpretação por IA ──

  async interpret(id: string): Promise<GeneticCounseling> {
    const record = await this.findOne(id);

    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.error('ANTHROPIC_API_KEY nao configurada');
      record.aiInterpretation = 'Erro: API key nao configurada.';
      return this.repo.save(record);
    }

    const context = JSON.stringify({
      indicationReason: record.indicationReason,
      nipt: {
        date: record.niptDate,
        lab: record.niptLab,
        t21: { risk: record.niptT21Risk, result: record.niptT21Result },
        t18: { result: record.niptT18Result },
        t13: { result: record.niptT13Result },
        sexChromosomes: record.niptSexChromosomes,
        microdeletions: record.niptMicrodeletions,
        rawReport: record.niptRawReport,
      },
      karyotype: {
        date: record.karyotypeDate,
        lab: record.karyotypeLab,
        method: record.karyotypeMethod,
        result: record.karyotypeResult,
        classification: record.karyotypeClassification,
        findings: record.karyotypeFindings,
      },
      microarray: {
        date: record.microarrayDate,
        lab: record.microarrayLab,
        platform: record.microarrayPlatform,
        result: record.microarrayResult,
        findings: record.microarrayFindings,
        rawReport: record.microarrayRawReport,
      },
      exome: {
        date: record.exomeDate,
        lab: record.exomeLab,
        type: record.exomeType,
        result: record.exomeResult,
        gene: record.exomeGene,
        variant: record.exomeVariant,
        findings: record.exomeFindings,
        rawReport: record.exomeRawReport,
      },
    });

    try {
      const response = await this.getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: GENETICS_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Interprete os seguintes resultados de exames genéticos pré-natais:\n\n${context}` },
        ],
      });

      const rawText = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      record.aiInterpretation = rawText;
      return this.repo.save(record);
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.error(`Erro na interpretacao genetica: [${err.status ?? 'N/A'}] ${err.message}`, err.stack);
      record.aiInterpretation = `Erro ao gerar interpretacao: ${err.message}`;
      return this.repo.save(record);
    }
  }
}
