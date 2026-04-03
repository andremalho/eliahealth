import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { FilesService } from './files.service.js';
import { CreateFileDto } from './dto/create-file.dto.js';
import { UpdateFileDto } from './dto/update-file.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Post('pregnancies/:pregnancyId/files')
  create(
    @Param('pregnancyId', ParseUUIDPipe) id: string,
    @CurrentUser('userId') uploadedBy: string,
    @Body() dto: CreateFileDto,
  ) { return this.service.create(id, uploadedBy, dto); }

  @Get('pregnancies/:pregnancyId/files')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string) { return this.service.findAll(id); }

  @Patch('files/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFileDto) {
    return this.service.update(id, dto);
  }

  @Delete('files/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}
