import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContraceptionRecord } from './contraception-record.entity.js';
import { ContraceptionRecordsService } from './contraception-records.service.js';
import { ContraceptionRecordsController } from './contraception-records.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ContraceptionRecord])],
  controllers: [ContraceptionRecordsController],
  providers: [ContraceptionRecordsService],
  exports: [ContraceptionRecordsService],
})
export class ContraceptionRecordsModule {}
