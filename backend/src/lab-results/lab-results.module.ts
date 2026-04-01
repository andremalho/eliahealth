import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabResult } from './lab-result.entity.js';
import { LabDocument } from './lab-document.entity.js';
import { LabResultsService } from './lab-results.service.js';
import { LabResultsController } from './lab-results.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([LabResult, LabDocument])],
  controllers: [LabResultsController],
  providers: [LabResultsService],
  exports: [LabResultsService],
})
export class LabResultsModule {}
