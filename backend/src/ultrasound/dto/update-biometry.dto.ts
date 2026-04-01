import { PartialType } from '@nestjs/mapped-types';
import { CreateBiometryDto } from './create-biometry.dto.js';

export class UpdateBiometryDto extends PartialType(CreateBiometryDto) {}
