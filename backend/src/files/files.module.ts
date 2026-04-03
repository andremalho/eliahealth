import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PregnancyFile } from './pregnancy-file.entity.js';
import { FilesService } from './files.service.js';
import { FilesController } from './files.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PregnancyFile])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
