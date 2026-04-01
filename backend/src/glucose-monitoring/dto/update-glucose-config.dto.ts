import { PartialType } from '@nestjs/mapped-types';
import { CreateGlucoseConfigDto } from './create-glucose-config.dto.js';

export class UpdateGlucoseConfigDto extends PartialType(CreateGlucoseConfigDto) {}
