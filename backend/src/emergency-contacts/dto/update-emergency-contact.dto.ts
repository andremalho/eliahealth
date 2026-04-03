import { PartialType } from '@nestjs/mapped-types';
import { CreateEmergencyContactDto } from './create-emergency-contact.dto.js';

export class UpdateEmergencyContactDto extends PartialType(CreateEmergencyContactDto) {}
