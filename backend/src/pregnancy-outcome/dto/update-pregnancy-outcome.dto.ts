import { PartialType } from '@nestjs/mapped-types';
import { CreatePregnancyOutcomeDto } from './create-pregnancy-outcome.dto.js';

export class UpdatePregnancyOutcomeDto extends PartialType(CreatePregnancyOutcomeDto) {}
