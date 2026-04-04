import { Controller, Get, Param, Res, ParseUUIDPipe } from '@nestjs/common';
import type { Response } from 'express';
import { CdaService } from './cda.service.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/auth.enums.js';

@Controller('cda')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class CdaController {
  constructor(private readonly cda: CdaService) {}

  @Get('rac/:pregnancyId')
  async getRac(@Param('pregnancyId', ParseUUIDPipe) id: string, @Res() res: Response) {
    const xml = await this.cda.generateRAC(id);
    res.set('Content-Type', 'application/xml').send(xml);
  }

  @Get('sumario-alta/:pregnancyId')
  async getSumarioAlta(@Param('pregnancyId', ParseUUIDPipe) id: string, @Res() res: Response) {
    const xml = await this.cda.generateSumarioAlta(id);
    res.set('Content-Type', 'application/xml').send(xml);
  }

  @Get('resultado-exame/:labResultId')
  async getResultadoExame(@Param('labResultId', ParseUUIDPipe) id: string, @Res() res: Response) {
    const xml = await this.cda.generateResultadoExame(id);
    res.set('Content-Type', 'application/xml').send(xml);
  }
}
