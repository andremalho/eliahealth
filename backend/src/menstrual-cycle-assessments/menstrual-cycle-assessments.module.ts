import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenstrualCycleAssessment } from './menstrual-cycle-assessment.entity.js';
import { MenstrualCycleAssessmentsService } from './menstrual-cycle-assessments.service.js';
import { MenstrualCycleAssessmentsController } from './menstrual-cycle-assessments.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([MenstrualCycleAssessment])],
  controllers: [MenstrualCycleAssessmentsController],
  providers: [MenstrualCycleAssessmentsService],
  exports: [MenstrualCycleAssessmentsService],
})
export class MenstrualCycleAssessmentsModule {}
