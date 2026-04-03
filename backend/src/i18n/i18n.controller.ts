import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { I18nService } from './i18n.service.js';
import { Language } from './translation.entity.js';
import { CreateTranslationDto } from './dto/create-translation.dto.js';
import { BulkTranslationDto } from './dto/bulk-translation.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('i18n')
export class I18nController {
  constructor(private readonly service: I18nService) {}

  @Public()
  @Get(':language')
  getByLanguage(@Param('language') language: Language) {
    return this.service.getByLanguage(language);
  }

  @Public()
  @Get(':language/:category')
  getByCategory(@Param('language') language: Language, @Param('category') category: string) {
    return this.service.getByLanguageAndCategory(language, category);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Body() dto: CreateTranslationDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateTranslationDto>) {
    return this.service.update(id, dto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  bulk(@Body() dto: BulkTranslationDto) { return this.service.bulkImport(dto.translations); }
}
