import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FhirService } from '../fhir/fhir.service.js';

/**
 * RNDS — Rede Nacional de Dados em Saude (Brazilian National Health Data Network)
 * Reference: https://rnds.saude.gov.br/
 * Authentication: ICP-Brasil digital certificate
 */
@Injectable()
export class RndsService {
  private readonly logger = new Logger(RndsService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly fhir: FhirService,
  ) {
    this.enabled = config.get('RNDS_ENABLED', 'false') === 'true';
  }

  async submitPatient(patient: Record<string, unknown>): Promise<void> {
    const resource = this.fhir.patientToFhir(patient);
    if (!this.enabled) {
      this.logger.log(`[DEV] RNDS submitPatient: ${JSON.stringify(resource).substring(0, 200)}`);
      return;
    }
    await this.sendToRnds('Patient', resource);
  }

  async submitLabResult(labResult: Record<string, unknown>): Promise<void> {
    const resource = this.fhir.labResultToFhir(labResult);
    if (!this.enabled) {
      this.logger.log(`[DEV] RNDS submitLabResult: ${JSON.stringify(resource).substring(0, 200)}`);
      return;
    }
    await this.sendToRnds('Observation', resource);
  }

  async submitVaccine(vaccine: Record<string, unknown>): Promise<void> {
    const resource = this.fhir.vaccineToFhir(vaccine);
    if (!this.enabled) {
      this.logger.log(`[DEV] RNDS submitVaccine: ${JSON.stringify(resource).substring(0, 200)}`);
      return;
    }
    await this.sendToRnds('Immunization', resource);
  }

  private async sendToRnds(resourceType: string, resource: Record<string, unknown>): Promise<void> {
    const baseUrl = this.config.get('RNDS_AUTH_URL', 'https://ehr.saude.gov.br/api/fhir/r4');
    // In production: authenticate with ICP-Brasil certificate via RNDS_CERTIFICATE_PATH
    const response = await fetch(`${baseUrl}/${resourceType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(resource),
    });
    this.logger.log(`RNDS ${resourceType}: ${response.status}`);
  }
}
