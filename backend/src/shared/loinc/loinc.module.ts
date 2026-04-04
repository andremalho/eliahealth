import { Global, Module } from '@nestjs/common';
import { LoincService } from './loinc.service.js';

@Global()
@Module({
  providers: [LoincService],
  exports: [LoincService],
})
export class LoincModule {}
