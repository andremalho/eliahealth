import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';

@Injectable()
export class NotesService {
  constructor(@InjectRepository(Note) private readonly repo: Repository<Note>) {}

  async create(pregnancyId: string, authorId: string, dto: CreateNoteDto): Promise<Note> {
    const note = this.repo.create({ ...dto, pregnancyId, authorId });
    return this.repo.save(note);
  }

  async findAll(pregnancyId: string): Promise<Note[]> {
    return this.repo.find({ where: { pregnancyId }, order: { isPinned: 'DESC', createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.repo.findOneBy({ id });
    if (!note) throw new NotFoundException(`Nota ${id} nao encontrada`);
    return note;
  }

  async update(id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.findOne(id);
    Object.assign(note, dto);
    return this.repo.save(note);
  }

  async remove(id: string): Promise<void> {
    const note = await this.findOne(id);
    await this.repo.remove(note);
  }
}
