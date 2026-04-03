import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { BirthCalendarService } from './birth-calendar.service.js';
import { BirthCalendarController } from './birth-calendar.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pregnancy]), PregnanciesModule],
  controllers: [BirthCalendarController],
  providers: [BirthCalendarService],
})
export class BirthCalendarModule {}
