import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OvulationInductionCycle } from './ovulation-induction-cycle.entity.js';
import { IuiCycle } from './iui-cycle.entity.js';
import { IvfCycle } from './ivf-cycle.entity.js';
import { OvulationInductionService } from './ovulation-induction.service.js';
import { IuiService } from './iui.service.js';
import { IvfService } from './ivf.service.js';
import { OvulationInductionController } from './ovulation-induction.controller.js';
import { IuiController } from './iui.controller.js';
import { IvfController } from './ivf.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OvulationInductionCycle, IuiCycle, IvfCycle]),
  ],
  controllers: [
    OvulationInductionController,
    IuiController,
    IvfController,
  ],
  providers: [OvulationInductionService, IuiService, IvfService],
  exports: [OvulationInductionService, IuiService, IvfService],
})
export class AssistedReproductionModule {}
