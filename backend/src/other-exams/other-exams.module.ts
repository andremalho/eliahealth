import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtherExam } from './other-exam.entity.js';
import { OtherExamsService } from './other-exams.service.js';
import { OtherExamsController } from './other-exams.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([OtherExam])],
  controllers: [OtherExamsController],
  providers: [OtherExamsService],
  exports: [OtherExamsService],
})
export class OtherExamsModule {}
