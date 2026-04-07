import { PartialType } from '@nestjs/mapped-types';
import { CreateIuiCycleDto } from './create-iui-cycle.dto.js';

export class UpdateIuiCycleDto extends PartialType(CreateIuiCycleDto) {}
