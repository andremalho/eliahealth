import { IsEnum, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { NoteType } from '../note.entity.js';

export class CreateNoteDto {
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
