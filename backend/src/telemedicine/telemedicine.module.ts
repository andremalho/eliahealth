import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemedicineSession } from './telemedicine.entity.js';
import { TelemedicineController } from './telemedicine.controller.js';
import { TelemedicineService } from './telemedicine.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TelemedicineSession])],
  controllers: [TelemedicineController],
  providers: [TelemedicineService],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}
