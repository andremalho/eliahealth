import {
  Controller,
  Get,
  Post,
  Param,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service.js';
import { OnboardingStepName } from './onboarding.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  findAll(@CurrentUser('userId') userId: string) {
    return this.onboardingService.findAll(userId);
  }

  @Post(':step/complete')
  complete(
    @CurrentUser('userId') userId: string,
    @Param('step') step: OnboardingStepName,
  ) {
    return this.onboardingService.completeStep(userId, step);
  }

  @Get('progress')
  progress(@CurrentUser('userId') userId: string) {
    return this.onboardingService.getProgress(userId);
  }
}
