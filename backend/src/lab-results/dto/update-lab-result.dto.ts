import { PartialType } from '@nestjs/mapped-types';
import { CreateLabResultDto } from './create-lab-result.dto.js';

export class UpdateLabResultDto extends PartialType(CreateLabResultDto) {}
