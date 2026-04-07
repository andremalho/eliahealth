import { PartialType } from '@nestjs/mapped-types';
import { CreateInfertilityWorkupDto } from './create-infertility-workup.dto.js';

export class UpdateInfertilityWorkupDto extends PartialType(
  CreateInfertilityWorkupDto,
) {}
