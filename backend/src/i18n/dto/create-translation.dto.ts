import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Language } from '../translation.entity.js';

export class CreateTranslationDto {
  @IsString() @IsNotEmpty() key: string;
  @IsEnum(Language) language: Language;
  @IsString() @IsNotEmpty() value: string;
  @IsString() @IsNotEmpty() category: string;
}
