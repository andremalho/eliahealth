import { PartialType } from '@nestjs/mapped-types';
import { CreateOvulationInductionCycleDto } from './create-ovulation-induction-cycle.dto.js';

export class UpdateOvulationInductionCycleDto extends PartialType(
  CreateOvulationInductionCycleDto,
) {}
