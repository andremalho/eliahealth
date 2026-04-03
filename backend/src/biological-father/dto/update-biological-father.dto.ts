import { PartialType } from '@nestjs/mapped-types';
import { CreateBiologicalFatherDto } from './create-biological-father.dto.js';
export class UpdateBiologicalFatherDto extends PartialType(CreateBiologicalFatherDto) {}
