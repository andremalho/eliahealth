import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { UtilsService } from './utils.service.js';

@Controller('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  @Public()
  @Get('clinical-options')
  getClinicalOptions() {
    return this.utilsService.getClinicalOptions();
  }

  @Public()
  @Get('cep/:cep')
  lookupCep(@Param('cep') cep: string) {
    return this.utilsService.lookupCep(cep);
  }
}
