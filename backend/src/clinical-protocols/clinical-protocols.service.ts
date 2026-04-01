import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalProtocol } from './clinical-protocol.entity.js';
import { ExamSchedule } from './exam-schedule.entity.js';
import { ProtocolCategory, ProtocolPriority } from './clinical-protocol.enums.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { LabResultsService } from '../lab-results/lab-results.service.js';
import { CreateClinicalProtocolDto } from './dto/create-clinical-protocol.dto.js';
import { UpdateClinicalProtocolDto } from './dto/update-clinical-protocol.dto.js';
import { CreateExamScheduleDto } from './dto/create-exam-schedule.dto.js';
import { UploadGuidelineDto } from './dto/upload-guideline.dto.js';

export interface ExamScheduleCheckResult {
  gaWeeks: number;
  gaDays: number;
  completed: ExamCheckItem[];
  pending: ExamCheckItem[];
  overdue: ExamCheckItem[];
}

export interface ExamCheckItem {
  schedule: ExamSchedule;
  labResult?: { id: string; examName: string; status: string; resultDate: string | null };
}

@Injectable()
export class ClinicalProtocolsService {
  constructor(
    @InjectRepository(ClinicalProtocol)
    private readonly protocolRepo: Repository<ClinicalProtocol>,
    @InjectRepository(ExamSchedule)
    private readonly scheduleRepo: Repository<ExamSchedule>,
    private readonly pregnanciesService: PregnanciesService,
    private readonly labResultsService: LabResultsService,
  ) {}

  // ── ClinicalProtocol CRUD ──

  async createProtocol(dto: CreateClinicalProtocolDto): Promise<ClinicalProtocol> {
    const protocol = this.protocolRepo.create(dto);
    return this.protocolRepo.save(protocol);
  }

  async findAllProtocols(category?: ProtocolCategory): Promise<ClinicalProtocol[]> {
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    return this.protocolRepo.find({ where, order: { priority: 'ASC', createdAt: 'DESC' } });
  }

  async findOneProtocol(id: string): Promise<ClinicalProtocol> {
    const protocol = await this.protocolRepo.findOneBy({ id });
    if (!protocol) {
      throw new NotFoundException(`Protocolo ${id} nao encontrado`);
    }
    return protocol;
  }

  async updateProtocol(id: string, dto: UpdateClinicalProtocolDto): Promise<ClinicalProtocol> {
    const protocol = await this.findOneProtocol(id);
    Object.assign(protocol, dto);
    return this.protocolRepo.save(protocol);
  }

  async uploadGuideline(dto: UploadGuidelineDto): Promise<ClinicalProtocol> {
    const protocol = this.protocolRepo.create({
      title: dto.title,
      category: ProtocolCategory.GUIDELINE,
      source: dto.source,
      content: dto.description ?? '',
      actionItems: [],
      priority: ProtocolPriority.ROUTINE,
      // fileUrl é armazenado no content por enquanto
      // TODO: quando houver storage de arquivos, salvar o PDF e referenciar aqui
    });
    protocol.content = `[PDF: ${dto.fileUrl}]\n\n${protocol.content}`;
    return this.protocolRepo.save(protocol);
  }

  // ── ExamSchedule CRUD ──

  async createSchedule(dto: CreateExamScheduleDto): Promise<ExamSchedule> {
    const schedule = this.scheduleRepo.create(dto);
    return this.scheduleRepo.save(schedule);
  }

  async findAllSchedules(): Promise<ExamSchedule[]> {
    return this.scheduleRepo.find({
      where: { isActive: true },
      order: { gaWeeksIdeal: 'ASC' },
    });
  }

  // ── Exam Schedule Check ──

  async checkExamSchedule(pregnancyId: string): Promise<ExamScheduleCheckResult> {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);

    const schedules = await this.scheduleRepo.find({ where: { isActive: true } });
    const labResults = await this.labResultsService.findAllByPregnancy(pregnancyId, {});

    const completed: ExamCheckItem[] = [];
    const pending: ExamCheckItem[] = [];
    const overdue: ExamCheckItem[] = [];

    for (const schedule of schedules) {
      // 1. Vinculo explicito por scheduleId (prioridade maxima)
      let matchingLab = labResults.find((lr) => lr.scheduleId === schedule.id);

      // 2. Fallback: nome exato ou substring (case insensitive)
      if (!matchingLab) {
        const scheduleName = schedule.examName.toLowerCase();
        matchingLab = labResults.find((lr) => {
          const labName = lr.examName.toLowerCase();
          return labName === scheduleName
            || labName.includes(scheduleName)
            || scheduleName.includes(labName);
        });
      }

      // 3. Fallback: mesma categoria de exame
      if (!matchingLab) {
        matchingLab = labResults.find(
          (lr) => lr.examCategory === schedule.examCategory,
        );
      }

      if (matchingLab) {
        completed.push({
          schedule,
          labResult: {
            id: matchingLab.id,
            examName: matchingLab.examName,
            status: matchingLab.status,
            resultDate: matchingLab.resultDate,
          },
        });
      } else if (ga.weeks > schedule.gaWeeksMax) {
        overdue.push({ schedule });
      } else if (ga.weeks >= schedule.gaWeeksMin) {
        pending.push({ schedule });
      } else {
        pending.push({ schedule });
      }
    }

    return { gaWeeks: ga.weeks, gaDays: ga.days, completed, pending, overdue };
  }
}
