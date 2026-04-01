import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateReferenceTableDto } from './create-reference-table.dto.js';

export class BulkImportReferenceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReferenceTableDto)
  rows: CreateReferenceTableDto[];
}
