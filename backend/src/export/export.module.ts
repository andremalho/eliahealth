import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pregnancy, Patient]),
    PregnanciesModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
