import { PartialType } from '@nestjs/mapped-types';
import { CreateIvfCycleDto } from './create-ivf-cycle.dto.js';

export class UpdateIvfCycleDto extends PartialType(CreateIvfCycleDto) {}
