import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { ResearchQuery } from './research-query.entity.js';
import { QueryStatus } from './dashboard.enums.js';

const QUERY_SYSTEM_PROMPT = `Você é um bioestatístico especializado em saúde materno-fetal.
Você tem acesso a uma tabela "research_records" com os campos:
research_id (varchar), maternal_age (int), age_group (enum), zip_code_partial (varchar),
region (varchar), state (varchar), blood_type (varchar), gravida (int), para (int),
abortus (int), plurality (int), ga_at_delivery (int, dias), delivery_type (varchar),
bmi (decimal), gestational_diabetes (boolean), hypertension (boolean),
preeclampsia (boolean), hellp_syndrome (boolean), fgr (boolean), preterm_birth (boolean),
high_risk_flags (jsonb array de strings), neonatal_data (jsonb array de objetos com birthWeight, apgar1min, apgar5min, sex, nicu).

Converta a pergunta em uma query SQL PostgreSQL segura (apenas SELECT, sem INSERT/UPDATE/DELETE/DROP/ALTER).
Sugira o melhor tipo de gráfico (pie, bar, line, scatter, number, table).
Explique o resultado clinicamente em português.

Retorne APENAS JSON: {"sql": "SELECT ...", "chartType": "bar", "explanation": "texto"}`;

@Injectable()
export class ResearchQueryService {
  private readonly logger = new Logger(ResearchQueryService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(ResearchQuery) private readonly repo: Repository<ResearchQuery>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private getClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
      });
    }
    return this.anthropicClient;
  }

  async askQuestion(userId: string, question: string): Promise<ResearchQuery> {
    const query = this.repo.create({ userId, question, status: QueryStatus.PROCESSING });
    await this.repo.save(query);

    const startTime = Date.now();

    try {
      const response = await this.getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: QUERY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: question }],
      });

      const rawText = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(clean) as { sql: string; chartType: string; explanation: string };

      // Segurança: apenas SELECT
      const sqlUpper = parsed.sql.trim().toUpperCase();
      if (!sqlUpper.startsWith('SELECT') || /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)\b/.test(sqlUpper)) {
        query.status = QueryStatus.ERROR;
        query.result = { error: 'Query insegura bloqueada' };
        query.executionTimeMs = Date.now() - startTime;
        return this.repo.save(query);
      }

      query.sqlGenerated = parsed.sql;
      query.chartType = parsed.chartType;

      // Executar query com timeout
      const result = await this.dataSource.query(parsed.sql);
      query.result = { data: result, explanation: parsed.explanation, rowCount: result.length };
      query.status = QueryStatus.COMPLETED;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro na research query: ${err.message}`, err.stack);
      query.status = QueryStatus.ERROR;
      query.result = { error: err.message };
    }

    query.executionTimeMs = Date.now() - startTime;
    return this.repo.save(query);
  }

  async getHistory(userId: string): Promise<ResearchQuery[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
