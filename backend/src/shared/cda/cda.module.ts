import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pregnancy } from '../../pregnancies/pregnancy.entity.js';
import { CdaService } from './cda.service.js';
import { CdaController } from './cda.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pregnancy])],
  controllers: [CdaController],
  providers: [CdaService],
  exports: [CdaService],
})
export class CdaModule {}
