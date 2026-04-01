import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { DocumentType, FileType } from '../lab-result.enums.js';

export class CreateLabDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsEnum(FileType)
  fileType: FileType;

  @IsOptional()
  @IsString()
  extractedText?: string;
}
