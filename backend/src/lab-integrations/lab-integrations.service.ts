import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { LabIntegration } from './lab-integration.entity.js';
import { LabWebhookLog, WebhookLogStatus } from './lab-webhook-log.entity.js';

@Injectable()
export class LabIntegrationsService {
  private readonly logger = new Logger(LabIntegrationsService.name);

  constructor(
    @InjectRepository(LabIntegration) private readonly integrationRepo: Repository<LabIntegration>,
    @InjectRepository(LabWebhookLog) private readonly logRepo: Repository<LabWebhookLog>,
  ) {}

  async findAll() {
    return this.integrationRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<LabIntegration>) {
    return this.integrationRepo.save(this.integrationRepo.create(data));
  }

  async update(id: string, data: Partial<LabIntegration>) {
    const integration = await this.integrationRepo.findOneBy({ id });
    if (!integration) throw new NotFoundException('Integracao nao encontrada');
    Object.assign(integration, data);
    return this.integrationRepo.save(integration);
  }

  async processWebhook(labCode: string, payload: Record<string, unknown>, signature?: string) {
    const integration = await this.integrationRepo.findOneBy({ labCode, isActive: true });
    if (!integration) {
      return { received: true };
    }

    // Verify HMAC signature
    if (signature) {
      const expected = createHmac('sha256', integration.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (signature !== expected) {
        this.logger.warn(`Invalid webhook signature for lab ${labCode}`);
      }
    }

    const patientIdentifier = (payload.cpf ?? payload.patientId ?? payload.identifier ?? '') as string;

    const log = this.logRepo.create({
      labIntegrationId: integration.id,
      patientIdentifier,
      payload,
      status: WebhookLogStatus.RECEIVED,
    });

    // Try to match patient
    const [patient] = await this.integrationRepo.query(
      `SELECT id FROM patients WHERE cpf = $1 OR cpf_hash = $2 LIMIT 1`,
      [patientIdentifier, patientIdentifier],
    );

    if (patient) {
      log.status = WebhookLogStatus.MATCHED;
      log.processedAt = new Date();

      // Create lab result linked to patient's active pregnancy
      const [pregnancy] = await this.integrationRepo.query(
        `SELECT id FROM pregnancies WHERE patient_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
        [patient.id],
      );

      if (pregnancy) {
        await this.integrationRepo.query(
          `INSERT INTO lab_results (pregnancy_id, exam_name, exam_category, requested_at, value, unit, result_text, source, lab_integration_id, lab_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'lab_integration', $8, $9)`,
          [
            pregnancy.id,
            payload.examName ?? 'Exame do laboratorio',
            payload.category ?? 'other',
            new Date().toISOString().split('T')[0],
            payload.value ?? null,
            payload.unit ?? null,
            payload.resultText ?? null,
            integration.id,
            integration.labName,
          ],
        );
      }
    } else {
      log.status = WebhookLogStatus.UNMATCHED;
    }

    await this.logRepo.save(log);
    return { received: true };
  }
}
