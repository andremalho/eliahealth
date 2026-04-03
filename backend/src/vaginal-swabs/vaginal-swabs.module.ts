import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaginalSwab } from './vaginal-swab.entity.js';
import { VaginalSwabsService } from './vaginal-swabs.service.js';
import { VaginalSwabsController } from './vaginal-swabs.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([VaginalSwab])],
  controllers: [VaginalSwabsController],
  providers: [VaginalSwabsService],
  exports: [VaginalSwabsService],
})
export class VaginalSwabsModule {}
