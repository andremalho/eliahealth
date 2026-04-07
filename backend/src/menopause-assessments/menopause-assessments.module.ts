import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenopauseAssessment } from './menopause-assessment.entity.js';
import { MenopauseAssessmentsService } from './menopause-assessments.service.js';
import { MenopauseAssessmentsController } from './menopause-assessments.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([MenopauseAssessment])],
  controllers: [MenopauseAssessmentsController],
  providers: [MenopauseAssessmentsService],
  exports: [MenopauseAssessmentsService],
})
export class MenopauseAssessmentsModule {}
