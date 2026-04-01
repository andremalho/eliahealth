import { PartialType } from '@nestjs/mapped-types';
import { CreateBpConfigDto } from './create-bp-config.dto.js';

export class UpdateBpConfigDto extends PartialType(CreateBpConfigDto) {}
