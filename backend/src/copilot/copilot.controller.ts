import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CopilotService } from './copilot.service.js';
import { AlertSeverity } from './copilot.enums.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('pregnancies/:pregnancyId/copilot/analyze')
  analyze(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.copilotService.analyzePregnancy(pregnancyId);
  }

  @Get('pregnancies/:pregnancyId/copilot/alerts')
  findAlerts(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('severity') severity?: AlertSeverity,
  ) {
    return this.copilotService.findAlerts(pregnancyId, severity);
  }

  @Post('pregnancies/:pregnancyId/copilot/check-exams')
  checkExams(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.copilotService.checkExams(pregnancyId);
  }

  @Patch('copilot/alerts/:id/read')
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.copilotService.markAsRead(id);
  }

  @Patch('copilot/alerts/:id/resolve')
  markAsResolved(@Param('id', ParseUUIDPipe) id: string) {
    return this.copilotService.markAsResolved(id);
  }
}
