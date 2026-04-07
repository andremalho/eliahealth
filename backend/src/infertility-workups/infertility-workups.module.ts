import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfertilityWorkup } from './infertility-workup.entity.js';
import { InfertilityWorkupsService } from './infertility-workups.service.js';
import { InfertilityWorkupsController } from './infertility-workups.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([InfertilityWorkup])],
  controllers: [InfertilityWorkupsController],
  providers: [InfertilityWorkupsService],
  exports: [InfertilityWorkupsService],
})
export class InfertilityWorkupsModule {}
