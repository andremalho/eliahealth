import { PartialType } from '@nestjs/mapped-types';
import { CreateClinicalProtocolDto } from './create-clinical-protocol.dto.js';

export class UpdateClinicalProtocolDto extends PartialType(CreateClinicalProtocolDto) {}
