import { Module } from '@nestjs/common';
import { UtilsController } from './utils.controller.js';
import { UtilsService } from './utils.service.js';

@Module({
  controllers: [UtilsController],
  providers: [UtilsService],
})
export class UtilsModule {}
