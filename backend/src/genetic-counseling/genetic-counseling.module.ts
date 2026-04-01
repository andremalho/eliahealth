import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneticCounseling } from './genetic-counseling.entity.js';
import { GeneticCounselingService } from './genetic-counseling.service.js';
import { GeneticCounselingController } from './genetic-counseling.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([GeneticCounseling])],
  controllers: [GeneticCounselingController],
  providers: [GeneticCounselingService],
  exports: [GeneticCounselingService],
})
export class GeneticCounselingModule {}
