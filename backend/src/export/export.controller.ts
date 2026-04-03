import { Controller, Get, Post, Param, Body, Res, ParseUUIDPipe } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Post('pregnancies/:pregnancyId/export/text')
  exportText(
    @Param('pregnancyId', ParseUUIDPipe) id: string,
    @Body() body: { sections: string[] },
  ) {
    return this.service.exportText(id, body.sections);
  }

  @Post('pregnancies/:pregnancyId/share/qrcode')
  generateQrCode(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.generateShareQrCode(id);
  }

  @Get('pregnancies/:pregnancyId/card/pdf')
  async generatePdfCard(
    @Param('pregnancyId', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.service.generatePdfCard(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cartao_gestante_${id.substring(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post('pregnancies/:pregnancyId/share/guest')
  shareWithGuest(
    @Param('pregnancyId', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { name: string; email: string; accessLevel: string; expiresAt: string },
  ) {
    return this.service.shareWithGuest(id, userId, body);
  }
}
