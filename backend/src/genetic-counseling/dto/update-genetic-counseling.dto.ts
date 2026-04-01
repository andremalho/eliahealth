import { PartialType } from '@nestjs/mapped-types';
import { CreateGeneticCounselingDto } from './create-genetic-counseling.dto.js';

export class UpdateGeneticCounselingDto extends PartialType(CreateGeneticCounselingDto) {}
