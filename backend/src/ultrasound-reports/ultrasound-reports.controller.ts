import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { UltrasoundReportsService } from './ultrasound-reports.service.js';
import { ScreeningRiskService } from './screening-risk.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

const IMG_DIR = join(process.cwd(), 'uploads', 'us-images');
if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

@Controller('ultrasound-reports')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class UltrasoundReportsController {
  constructor(
    private readonly service: UltrasoundReportsService,
    private readonly screeningService: ScreeningRiskService,
  ) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: {
      patientId: string;
      pregnancyId?: string;
      templateId: string;
      category: string;
      reportDate: string;
      data: Record<string, unknown>;
      conclusion?: string;
    },
  ) {
    return this.service.create({ ...dto, doctorId: userId, tenantId });
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.service.findByPatient(patientId);
  }

  @Get('pregnancy/:pregnancyId')
  findByPregnancy(@Param('pregnancyId') pregnancyId: string) {
    return this.service.findByPregnancy(pregnancyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.service.update(id, dto);
  }

  @Post(':id/sign')
  sign(
    @Param('id') id: string,
    @Body() body: { doctorName: string; doctorCrm: string },
  ) {
    return this.service.sign(id, body.doctorName, body.doctorCrm);
  }

  @Post(':id/export')
  markExported(@Param('id') id: string, @Body() body: { format: string }) {
    return this.service.markExported(id, body.format);
  }

  @Post(':id/send')
  markSent(@Param('id') id: string, @Body() body: { via: string; to: string }) {
    return this.service.markSent(id, body.via, body.to);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ── Screening Risk Calculations ──

  @Post('screening/trisomy')
  calculateTrisomyRisk(@Body() body: {
    maternalAge: number;
    ccnMm: number;
    tnMm: number;
    nasalBone?: 'present' | 'hypoplastic' | 'absent';
    dvWaveA?: 'positive' | 'absent' | 'reversed';
    tricuspidRegurg?: boolean;
    pappaMoM?: number;
    betaHcgMoM?: number;
    tnMoM?: number;
  }) {
    const t21 = this.screeningService.calculateCombinedRiskT21(body);
    const t18 = this.screeningService.calculateRiskT18({
      maternalAge: body.maternalAge,
      tnMoM: body.tnMoM,
      pappaMoM: body.pappaMoM,
      betaHcgMoM: body.betaHcgMoM,
    });
    const priorT21 = this.screeningService.getAgePriorRiskT21(body.maternalAge);

    return {
      priorT21: `1:${priorT21}`,
      t21: { risk: `1:${t21.riskDenominator}`, classification: t21.classification },
      t18: { risk: `1:${t18.riskDenominator}` },
    };
  }

  @Post('screening/preeclampsia')
  calculatePERisk(@Body() body: {
    maternalAge: number;
    weightKg: number;
    heightCm?: number;
    nulliparous: boolean;
    previousPE: boolean;
    previousEarlyPE: boolean;
    chronicHypertension: boolean;
    diabetes: boolean;
    sle: boolean;
    familyHistoryPE: boolean;
    mapMoM?: number;
    utaPiMoM?: number;
    pappaMoM?: number;
    plgfMoM?: number;
  }) {
    return this.screeningService.calculatePERisk(body);
  }

  // ── Image Upload ──

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: IMG_DIR,
      filename: (_req, file, cb) => {
        const name = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, name);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      cb(null, allowed.includes(file.mimetype));
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const report = await this.service.findOne(id);
    const images = report.images ?? [];
    images.push({
      url: `/uploads/us-images/${file.filename}`,
      filename: file.originalname,
      order: images.length,
    });
    return this.service.update(id, { images } as any);
  }

  // ── PDF Export ──

  @Get(':id/pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="laudo_${id.slice(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
