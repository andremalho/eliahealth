import { Global, Module } from '@nestjs/common';
import { FhirService } from './fhir.service.js';

@Global()
@Module({
  providers: [FhirService],
  exports: [FhirService],
})
export class FhirModule {}
