import { PartialType } from '@nestjs/mapped-types';
import { CreateBiophysicalDto } from './create-biophysical.dto.js';

export class UpdateBiophysicalDto extends PartialType(CreateBiophysicalDto) {}
