import { PartialType } from '@nestjs/mapped-types';
import { CreatePrescriptionDto } from './create-prescription.dto.js';
export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {}
