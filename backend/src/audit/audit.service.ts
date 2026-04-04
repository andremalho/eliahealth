import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity.js';

export interface AuditFilters {
  patientId?: string;
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<void> {
    const entry = this.repo.create(data);
    await this.repo.save(entry);
  }

  async findAll(filters: AuditFilters) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');

    if (filters.patientId) qb.andWhere('a.patient_id = :patientId', { patientId: filters.patientId });
    if (filters.userId) qb.andWhere('a.user_id = :userId', { userId: filters.userId });
    if (filters.resource) qb.andWhere('a.resource ILIKE :resource', { resource: `%${filters.resource}%` });
    if (filters.action) qb.andWhere('a.action = :action', { action: filters.action });
    if (filters.startDate) qb.andWhere('a.created_at >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('a.created_at <= :endDate', { endDate: `${filters.endDate}T23:59:59` });

    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;
    qb.take(limit).skip(offset);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPatientAccessLog(patientId: string) {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
