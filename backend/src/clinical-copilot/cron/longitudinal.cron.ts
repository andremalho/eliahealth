import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LongitudinalIntelligenceService } from '../services/longitudinal-intelligence.service.js';
import { Patient } from '../../patients/patient.entity.js';

@Injectable()
export class LongitudinalCron {
  private readonly logger = new Logger(LongitudinalCron.name);

  constructor(
    private readonly intelligenceService: LongitudinalIntelligenceService,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  @Cron('0 6 * * *') // Todo dia as 6h
  async runDailyAnalysis() {
    this.logger.log('Starting daily longitudinal analysis...');

    try {
      // Buscar tenants distintos
      const tenants: { tenant_id: string }[] = await this.patientRepo.query(
        `SELECT DISTINCT tenant_id FROM patients WHERE tenant_id IS NOT NULL`,
      );

      for (const t of tenants) {
        try {
          await this.intelligenceService.analyzeForTenant(t.tenant_id);
        } catch (err) {
          this.logger.error(
            `Longitudinal analysis failed for tenant ${t.tenant_id}: ${(err as Error).message}`,
          );
        }
      }

      this.logger.log(`Daily longitudinal analysis completed for ${tenants.length} tenants.`);
    } catch (err) {
      this.logger.error(`Daily longitudinal analysis failed: ${(err as Error).message}`);
    }
  }
}
