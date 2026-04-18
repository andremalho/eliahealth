import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common';
import { DoctorOnboardingService } from './doctor-onboarding.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('doctor-onboarding')
export class DoctorOnboardingController {
  constructor(private readonly service: DoctorOnboardingService) {}

  @Get('progress/:flowName')
  getProgress(
    @Param('flowName') flowName: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.getProgress(userId, flowName);
  }

  @Patch('progress/:flowName')
  updateProgress(
    @Param('flowName') flowName: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { currentStep?: number; completed?: boolean; skipped?: boolean },
  ) {
    return this.service.updateProgress(userId, tenantId, flowName, body);
  }

  @Post('restart/:flowName')
  restart(
    @Param('flowName') flowName: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.restart(userId, tenantId, flowName);
  }
}
