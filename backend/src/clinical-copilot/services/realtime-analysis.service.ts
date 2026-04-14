import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { CopilotInsight } from '../entities/copilot-insight.entity.js';
import { InsightType } from '../enums/insight-type.enum.js';
import { TriggerEvent } from '../enums/trigger-event.enum.js';
import { AnalysisContextService } from './analysis-context.service.js';
import { buildRealtimePrompt } from '../prompts/realtime-analysis.prompt.js';
import { SessionContext } from '../interfaces/ws-events.interface.js';

@Injectable()
export class RealtimeAnalysisService {
  private readonly logger = new Logger(RealtimeAnalysisService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(CopilotInsight)
    private readonly insightRepo: Repository<CopilotInsight>,
    private readonly configService: ConfigService,
    private readonly contextService: AnalysisContextService,
  ) {}

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      this.anthropicClient = new Anthropic({ apiKey });
    }
    return this.anthropicClient;
  }

  async analyze(sessionId: string, trigger: TriggerEvent): Promise<CopilotInsight[]> {
    const startTime = Date.now();
    const context = this.contextService.getSessionContext(sessionId);
    if (!context) return [];

    try {
      const prompt = buildRealtimePrompt({
        trigger,
        currentData: context.currentFormState,
        patientProfile: context.patientProfile ?? {},
        recentHistory: context.recentHistory,
        previousInsights: context.previousInsights,
      });

      const response = await this.getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') return [];

      const insights = this.parseInsights(textBlock.text, context, trigger, Date.now() - startTime);

      if (insights.length > 0) {
        await this.insightRepo.save(insights);
        this.contextService.addInsightsToSession(sessionId, insights);
      }

      return insights;
    } catch (err) {
      this.logger.error(`Falha na analise realtime: ${(err as Error).message}`);
      return [];
    }
  }

  async fullAnalysis(sessionId: string): Promise<CopilotInsight[]> {
    return this.analyze(sessionId, TriggerEvent.EXPLICIT_REQUEST);
  }

  async recordInsightAction(payload: {
    insightId: string;
    action: string;
    note?: string;
  }): Promise<void> {
    await this.insightRepo.update(payload.insightId, {
      doctorAction: payload.action,
      doctorNote: payload.note ?? null,
    });
  }

  private parseInsights(
    response: string,
    context: SessionContext,
    trigger: TriggerEvent,
    generationTimeMs: number,
  ): CopilotInsight[] {
    try {
      let jsonStr = response.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      const parsed = JSON.parse(jsonStr);
      const items = parsed.insights ?? [];
      if (!Array.isArray(items)) return [];

      const validTypes = Object.values(InsightType);

      return items
        .filter((item: any) => item.title && item.description)
        .slice(0, 3)
        .map((item: any) =>
          this.insightRepo.create({
            tenantId: context.tenantId,
            consultationId: context.consultationId,
            patientId: context.patientId,
            doctorId: context.doctorId,
            type: validTypes.includes(item.type) ? item.type : InsightType.CONTEXTUAL_ALERT,
            triggeredBy: trigger,
            title: String(item.title).slice(0, 300),
            description: String(item.description),
            suggestedAction: item.suggested_action ?? null,
            guidelineReference: item.guideline_reference?.slice(0, 200) ?? null,
            severity: item.severity === 'action_required' ? 'action_required' : 'attention',
            generationTimeMs,
          }),
        );
    } catch (err) {
      this.logger.warn(`Falha ao parsear insights: ${(err as Error).message}`);
      return [];
    }
  }
}
