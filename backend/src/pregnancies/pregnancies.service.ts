import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pregnancy } from './pregnancy.entity.js';
import { GaMethod } from './pregnancy.enums.js';
import { CreatePregnancyDto } from './dto/create-pregnancy.dto.js';
import { UpdatePregnancyDto } from './dto/update-pregnancy.dto.js';

@Injectable()
export class PregnanciesService {
  constructor(
    @InjectRepository(Pregnancy)
    private readonly repo: Repository<Pregnancy>,
  ) {}

  async create(patientId: string, dto: CreatePregnancyDto): Promise<Pregnancy> {
    const edd = this.calculateEdd(dto);
    const pregnancy = this.repo.create({ ...dto, patientId, edd });
    return this.repo.save(pregnancy);
  }

  async findAllByPatient(patientId: string): Promise<Pregnancy[]> {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pregnancy> {
    const pregnancy = await this.repo.findOneBy({ id });
    if (!pregnancy) {
      throw new NotFoundException(`Gestacao ${id} nao encontrada`);
    }
    return pregnancy;
  }

  async update(id: string, dto: UpdatePregnancyDto): Promise<Pregnancy> {
    const pregnancy = await this.findOne(id);
    Object.assign(pregnancy, dto);

    if (dto.lmpDate || dto.gaMethod || dto.usDatingDate || dto.usDatingGaDays !== undefined) {
      pregnancy.edd = this.calculateEdd(pregnancy);
    }

    return this.repo.save(pregnancy);
  }

  getGestationalAge(pregnancy: Pregnancy) {
    const today = new Date();
    let gaDays: number;

    if (pregnancy.gaMethod === GaMethod.ULTRASOUND && pregnancy.usDatingGaDays != null && pregnancy.usDatingDate) {
      const usDate = new Date(pregnancy.usDatingDate);
      const daysSinceUs = Math.floor((today.getTime() - usDate.getTime()) / 86_400_000);
      gaDays = pregnancy.usDatingGaDays + daysSinceUs;
    } else {
      const lmp = new Date(pregnancy.lmpDate);
      gaDays = Math.floor((today.getTime() - lmp.getTime()) / 86_400_000);
    }

    return {
      weeks: Math.floor(gaDays / 7),
      days: gaDays % 7,
      totalDays: gaDays,
      edd: pregnancy.edd,
    };
  }

  private calculateEdd(
    data: { lmpDate: string; gaMethod: GaMethod; usDatingDate?: string | null; usDatingGaDays?: number | null },
  ): string {
    if (data.gaMethod === GaMethod.ULTRASOUND && data.usDatingGaDays != null && data.usDatingDate) {
      const usDate = new Date(data.usDatingDate);
      const remainingDays = 280 - data.usDatingGaDays;
      const edd = new Date(usDate.getTime() + remainingDays * 86_400_000);
      return edd.toISOString().split('T')[0];
    }

    // LMP ou IVF: DPP = DUM + 280 dias
    const lmp = new Date(data.lmpDate);
    const edd = new Date(lmp.getTime() + 280 * 86_400_000);
    return edd.toISOString().split('T')[0];
  }
}
