import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity.js';

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

  async findAll(filters: {
    patientId?: string;
    userId?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  }) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');

    if (filters.patientId) qb.andWhere('a.patient_id = :patientId', { patientId: filters.patientId });
    if (filters.userId) qb.andWhere('a.user_id = :userId', { userId: filters.userId });
    if (filters.resource) qb.andWhere('a.resource = :resource', { resource: filters.resource });

    qb.take(filters.limit ?? 100).skip(filters.offset ?? 0);
    return qb.getManyAndCount();
  }

  async findPatientAccessLog(patientId: string) {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
