import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vaccine } from './vaccine.entity.js';
import { VaccinesService } from './vaccines.service.js';
import { VaccinesController } from './vaccines.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vaccine]), PregnanciesModule],
  controllers: [VaccinesController],
  providers: [VaccinesService],
  exports: [VaccinesService],
})
export class VaccinesModule {}
