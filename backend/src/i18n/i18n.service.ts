import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation, Language } from './translation.entity.js';
import { CreateTranslationDto } from './dto/create-translation.dto.js';

@Injectable()
export class I18nService {
  constructor(@InjectRepository(Translation) private readonly repo: Repository<Translation>) {}

  async getByLanguage(language: Language): Promise<Record<string, string>> {
    const translations = await this.repo.find({ where: { language } });
    return Object.fromEntries(translations.map((t) => [t.key, t.value]));
  }

  async getByLanguageAndCategory(language: Language, category: string): Promise<Record<string, string>> {
    const translations = await this.repo.find({ where: { language, category } });
    return Object.fromEntries(translations.map((t) => [t.key, t.value]));
  }

  async create(dto: CreateTranslationDto): Promise<Translation> {
    const existing = await this.repo.findOneBy({ key: dto.key, language: dto.language });
    if (existing) { Object.assign(existing, dto); return this.repo.save(existing); }
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<CreateTranslationDto>): Promise<Translation> {
    const t = await this.repo.findOneBy({ id });
    if (!t) throw new NotFoundException(`Traducao ${id} nao encontrada`);
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async bulkImport(translations: CreateTranslationDto[]): Promise<{ imported: number }> {
    let count = 0;
    for (const dto of translations) {
      await this.create(dto);
      count++;
    }
    return { imported: count };
  }

  async translate(key: string, language: Language): Promise<string> {
    const t = await this.repo.findOneBy({ key, language });
    if (t) return t.value;
    const fallback = await this.repo.findOneBy({ key, language: Language.PT_BR });
    return fallback?.value ?? key;
  }
}
