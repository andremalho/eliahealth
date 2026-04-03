import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Annotation } from './annotation.entity.js';
import { AnnotationsService } from './annotations.service.js';
import { AnnotationsController } from './annotations.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Annotation])],
  controllers: [AnnotationsController],
  providers: [AnnotationsService],
  exports: [AnnotationsService],
})
export class AnnotationsModule {}
