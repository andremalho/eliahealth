import { Global, Module } from '@nestjs/common';
import { RndsService } from './rnds.service.js';

@Global()
@Module({
  providers: [RndsService],
  exports: [RndsService],
})
export class RndsModule {}
