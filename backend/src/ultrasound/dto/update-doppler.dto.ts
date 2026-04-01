import { PartialType } from '@nestjs/mapped-types';
import { CreateDopplerDto } from './create-doppler.dto.js';

export class UpdateDopplerDto extends PartialType(CreateDopplerDto) {}
