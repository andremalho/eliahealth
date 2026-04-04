import { Module } from '@nestjs/common';
import { CnesService } from './cnes.service.js';
import { CnesController } from './cnes.controller.js';

@Module({
  controllers: [CnesController],
  providers: [CnesService],
  exports: [CnesService],
})
export class CnesModule {}
