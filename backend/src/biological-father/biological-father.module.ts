import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiologicalFather } from './biological-father.entity.js';
import { BiologicalFatherService } from './biological-father.service.js';
import { BiologicalFatherController } from './biological-father.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([BiologicalFather])],
  controllers: [BiologicalFatherController],
  providers: [BiologicalFatherService],
  exports: [BiologicalFatherService],
})
export class BiologicalFatherModule {}
