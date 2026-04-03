import { Module } from '@nestjs/common';
import { AiFillService } from './ai-fill.service.js';
import { AiFillController } from './ai-fill.controller.js';

@Module({
  controllers: [AiFillController],
  providers: [AiFillService],
  exports: [AiFillService],
})
export class AiFillModule {}
