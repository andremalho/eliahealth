import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostpartumConsultation } from './postpartum-consultation.entity.js';
import { PregnancyOutcome } from '../pregnancy-outcome/pregnancy-outcome.entity.js';
import { PostpartumController } from './postpartum.controller.js';
import { PostpartumService } from './postpartum.service.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostpartumConsultation, PregnancyOutcome]),
    PregnanciesModule,
  ],
  controllers: [PostpartumController],
  providers: [PostpartumService],
  exports: [PostpartumService],
})
export class PostpartumModule {}
