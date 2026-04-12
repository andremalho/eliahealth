import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingRecord, BillingStatus } from './billing.entity.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingRecord) private readonly repo: Repository<BillingRecord>,
  ) {}

  async create(dto: Partial<BillingRecord>): Promise<BillingRecord> {
    const record = this.repo.create({ ...dto, status: BillingStatus.DRAFT });
    // Auto-calculate total
    if (record.procedures?.length) {
      record.totalValue = record.procedures.reduce((sum, p) => sum + p.totalValue, 0);
    }
    return this.repo.save(record);
  }

  async findAll(tenantId?: string, status?: string, page = 1, limit = 50) {
    const qb = this.repo.createQueryBuilder('b')
      .leftJoinAndSelect('b.patient', 'p')
      .orderBy('b.serviceDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (tenantId) qb.andWhere('b.tenantId = :tenantId', { tenantId });
    if (status) qb.andWhere('b.status = :status', { status });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findByPatient(patientId: string) {
    return this.repo.find({
      where: { patientId },
      order: { serviceDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BillingRecord> {
    const r = await this.repo.findOne({ where: { id }, relations: ['patient'] });
    if (!r) throw new NotFoundException('Registro de faturamento nao encontrado');
    return r;
  }

  async update(id: string, dto: Partial<BillingRecord>) {
    const r = await this.findOne(id);
    Object.assign(r, dto);
    if (r.procedures?.length) {
      r.totalValue = r.procedures.reduce((sum, p) => sum + p.totalValue, 0);
    }
    return this.repo.save(r);
  }

  async submit(id: string) {
    const r = await this.findOne(id);
    r.status = BillingStatus.SUBMITTED;
    r.submittedAt = new Date();
    return this.repo.save(r);
  }

  async markPaid(id: string, paidValue: number) {
    const r = await this.findOne(id);
    r.status = BillingStatus.PAID;
    r.paidAt = new Date();
    r.paidValue = paidValue;
    return this.repo.save(r);
  }

  async deny(id: string, reason: string) {
    const r = await this.findOne(id);
    r.status = BillingStatus.DENIED;
    r.denialReason = reason;
    return this.repo.save(r);
  }

  async getSummary(tenantId?: string) {
    const base = tenantId ? `WHERE b.tenant_id = '${tenantId}'` : '';
    const [result] = await this.repo.query(`
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END)::int AS drafts,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END)::int AS submitted,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::int AS approved,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END)::int AS denied,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)::int AS paid,
        COALESCE(SUM(total_value), 0)::decimal AS total_billed,
        COALESCE(SUM(paid_value), 0)::decimal AS total_received,
        COALESCE(SUM(CASE WHEN status = 'denied' THEN total_value ELSE 0 END), 0)::decimal AS total_denied
      FROM billing_records b ${base}
    `);
    return result;
  }
}
