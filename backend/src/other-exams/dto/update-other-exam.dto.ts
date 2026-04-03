import { PartialType } from '@nestjs/mapped-types';
import { CreateOtherExamDto } from './create-other-exam.dto.js';

export class UpdateOtherExamDto extends PartialType(CreateOtherExamDto) {}
