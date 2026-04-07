import { PartialType } from '@nestjs/mapped-types';
import { CreateContraceptionRecordDto } from './create-contraception-record.dto.js';

export class UpdateContraceptionRecordDto extends PartialType(
  CreateContraceptionRecordDto,
) {}
