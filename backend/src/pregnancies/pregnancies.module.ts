import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pregnancy } from './pregnancy.entity.js';
import { PregnanciesService } from './pregnancies.service.js';
import { PregnanciesController } from './pregnancies.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pregnancy])],
  controllers: [PregnanciesController],
  providers: [PregnanciesService],
  exports: [PregnanciesService],
})
export class PregnanciesModule {}
