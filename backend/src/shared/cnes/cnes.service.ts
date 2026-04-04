import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CnesService {
  private readonly logger = new Logger(CnesService.name);
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.enabled = config.get('CNES_ENABLED', 'false') === 'true';
  }

  validateCnes(code: string): boolean {
    return /^\d{7}$/.test(code);
  }

  async getCnesInfo(code: string) {
    if (!this.validateCnes(code)) {
      throw new BadRequestException('Codigo CNES deve ter 7 digitos');
    }

    if (!this.enabled) {
      this.logger.log(`[DEV] CNES lookup: ${code}`);
      return {
        cnesCode: code,
        name: `Estabelecimento ${code} (mock)`,
        city: 'Sao Paulo',
        state: 'SP',
        type: 'Clinica',
        mock: true,
      };
    }

    const response = await fetch(
      `https://apisisab.saude.gov.br/cnes/estabelecimentos/${code}`,
    );
    if (!response.ok) {
      throw new BadRequestException('CNES nao encontrado');
    }
    return response.json();
  }
}
