import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const AI_FILL_PROMPT = `Você é um assistente médico que extrai dados estruturados de texto livre de consulta obstétrica. Analise o texto e retorne APENAS um JSON válido com os campos identificados:

{
  "date": "YYYY-MM-DD ou null",
  "weightKg": number ou null,
  "bpSystolic": number ou null,
  "bpDiastolic": number ou null,
  "fundalHeightCm": number ou null,
  "fetalHeartRate": number ou null,
  "edemaGrade": "none"|"1+"|"2+"|"3+"|"4+" ou null,
  "symptoms": ["sintoma1", "sintoma2"] ou [],
  "subjective": "queixa principal extraída" ou null,
  "objective": "dados objetivos adicionais" ou null,
  "assessment": "impressão diagnóstica se mencionada" ou null,
  "plan": "conduta se mencionada" ou null
}

Extraia valores numéricos. PA "135x88" → bpSystolic: 135, bpDiastolic: 88. Peso "68kg" → weightKg: 68. AU "24cm" → fundalHeightCm: 24. BCF "148" → fetalHeartRate: 148. Retorne null para campos não mencionados.`;

@Injectable()
export class AiFillService {
  private readonly logger = new Logger(AiFillService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
      });
    }
    return this.anthropicClient;
  }

  async parseAndFill(text: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: AI_FILL_PROMPT,
        messages: [{ role: 'user', content: text }],
      });

      const rawText = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');

      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(clean);
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.error(`Erro no AI Fill: [${err.status ?? 'N/A'}] ${err.message}`);
      return { error: 'Nao foi possivel processar o texto' };
    }
  }
}
