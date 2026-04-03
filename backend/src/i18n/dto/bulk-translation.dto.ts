import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateTranslationDto } from './create-translation.dto.js';

export class BulkTranslationDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateTranslationDto)
  translations: CreateTranslationDto[];
}
