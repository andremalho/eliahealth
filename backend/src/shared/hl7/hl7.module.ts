import { Module } from '@nestjs/common';
import { Hl7v2Service } from './hl7v2.service.js';
import { Hl7Controller } from './hl7.controller.js';

@Module({
  controllers: [Hl7Controller],
  providers: [Hl7v2Service],
  exports: [Hl7v2Service],
})
export class Hl7Module {}
