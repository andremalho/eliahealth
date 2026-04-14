import { Logger, UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard.js';
import { RealtimeAnalysisService } from '../services/realtime-analysis.service.js';
import { AnalysisContextService } from '../services/analysis-context.service.js';
import { TriggerEvent } from '../enums/trigger-event.enum.js';

const ANALYZABLE_TRIGGERS: TriggerEvent[] = [
  TriggerEvent.CHIEF_COMPLAINT,
  TriggerEvent.VITAL_SIGNS,
  TriggerEvent.DIAGNOSIS_ADDED,
  TriggerEvent.PRESCRIPTION_ADDED,
  TriggerEvent.PHYSICAL_EXAM,
];

@WebSocketGateway({
  namespace: '/copilot',
  cors: { origin: '*' },
})
@UseGuards(WsJwtGuard)
export class CopilotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CopilotGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly realtimeService: RealtimeAnalysisService,
    private readonly contextService: AnalysisContextService,
  ) {}

  async handleConnection(client: Socket) {
    const user = (client as any).user;
    const { consultationId, patientId } = client.handshake.query;

    if (!consultationId || !user) {
      client.disconnect();
      return;
    }

    this.logger.log(`Copilot WS connected: ${client.id} (consultation: ${consultationId})`);

    await this.contextService.initSession(client.id, {
      consultationId: consultationId as string,
      patientId: (patientId as string) ?? '',
      tenantId: user.tenantId,
      doctorId: user.userId,
    });

    await this.contextService.loadPatientContext(client.id);
    client.join(`consultation:${consultationId}`);
    client.emit('copilot:connected', { sessionId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Copilot WS disconnected: ${client.id}`);
    this.contextService.destroySession(client.id);
  }

  @SubscribeMessage('consultation:field_updated')
  async handleFieldUpdate(client: Socket, payload: { trigger: TriggerEvent; field: string; value: unknown; currentFormState: Record<string, unknown> }) {
    this.contextService.updateSessionData(client.id, payload);

    if (!ANALYZABLE_TRIGGERS.includes(payload.trigger)) return;

    const insights = await this.realtimeService.analyze(client.id, payload.trigger);

    if (insights.length > 0) {
      client.emit('copilot:insights', {
        trigger: payload.trigger,
        insights,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('consultation:request_analysis')
  async handleExplicitAnalysis(client: Socket) {
    const insights = await this.realtimeService.fullAnalysis(client.id);
    client.emit('copilot:insights', {
      trigger: 'explicit_request',
      insights,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('copilot:insight_action')
  async handleInsightAction(client: Socket, payload: { insightId: string; action: 'accepted' | 'dismissed'; note?: string }) {
    await this.realtimeService.recordInsightAction(payload);
  }
}
