import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Post('pregnancies/:pregnancyId/notes')
  create(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @CurrentUser('userId') authorId: string,
    @Body() dto: CreateNoteDto,
  ) { return this.service.create(pregnancyId, authorId, dto); }

  @Get('pregnancies/:pregnancyId/notes')
  findAll(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findAll(pregnancyId);
  }

  @Patch('notes/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNoteDto) {
    return this.service.update(id, dto);
  }

  @Delete('notes/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
