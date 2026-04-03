import { Controller, Get, Post, Param, Query, Res, ParseUUIDPipe } from '@nestjs/common';
import type { Response } from 'express';
import { ResearchService } from './research.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('research')
@Roles(UserRole.ADMIN, UserRole.RESEARCHER)
export class ResearchController {
  constructor(private readonly service: ResearchService) {}

  @Get('records')
  findRecords(
    @Query('ageMin') ageMin?: string,
    @Query('ageMax') ageMax?: string,
    @Query('region') region?: string,
    @Query('condition') condition?: string,
    @Query('deliveryType') deliveryType?: string,
  ) {
    return this.service.findRecords({
      ageMin: ageMin ? parseInt(ageMin, 10) : undefined,
      ageMax: ageMax ? parseInt(ageMax, 10) : undefined,
      region,
      condition,
      deliveryType,
    });
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('export')
  async exportCsv(@Res() res: Response) {
    const csv = await this.service.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=research_export.csv');
    res.send(csv);
  }

  @Post('consent/:patientId')
  registerConsent(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.registerConsent(patientId);
  }
}
