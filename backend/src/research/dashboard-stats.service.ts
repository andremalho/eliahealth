import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResearchRecord } from './research-record.entity.js';
import { DashboardMetric } from './dashboard.enums.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(ResearchRecord) private readonly repo: Repository<ResearchRecord>,
    @InjectRepository(Pregnancy) private readonly pregnancyRepo: Repository<Pregnancy>,
  ) {}

  async getMetricData(metric: DashboardMetric, filters?: Record<string, unknown>) {
    switch (metric) {
      case DashboardMetric.RISK_DISTRIBUTION: return this.getRiskDistribution();
      case DashboardMetric.PREECLAMPSIA_RATE: return this.getConditionRate('preeclampsia');
      case DashboardMetric.GESTATIONAL_DIABETES_RATE: return this.getConditionRate('gestational_diabetes');
      case DashboardMetric.FGR_RATE: return this.getConditionRate('fgr');
      case DashboardMetric.PRETERM_BIRTH_RATE: return this.getConditionRate('preterm_birth');
      case DashboardMetric.HELLP_RATE: return this.getConditionRate('hellp_syndrome');
      case DashboardMetric.CESAREAN_RATE: return this.getCesareanRate();
      case DashboardMetric.MATERNAL_AGE_DISTRIBUTION: return this.getAgeDistribution();
      case DashboardMetric.BMI_DISTRIBUTION: return this.getBmiDistribution();
      case DashboardMetric.DELIVERY_TYPE_DISTRIBUTION: return this.getDeliveryTypes();
      case DashboardMetric.REGIONAL_DISTRIBUTION: return this.getRegionalDistribution();
      case DashboardMetric.ACTIVE_VS_COMPLETED: return this.getActiveVsCompleted();
      case DashboardMetric.HIGH_VS_LOW_RISK: return this.getRiskDistribution();
      default: return { metric, data: null };
    }
  }

  async getOverview() {
    // Single query for all counts (replaces 8 separate queries)
    const [stats] = await this.repo.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE preeclampsia = true)::int AS preeclampsia,
        COUNT(*) FILTER (WHERE gestational_diabetes = true)::int AS gestational_diabetes,
        COUNT(*) FILTER (WHERE hellp_syndrome = true)::int AS hellp_syndrome,
        COUNT(*) FILTER (WHERE fgr = true)::int AS fgr,
        COUNT(*) FILTER (WHERE preterm_birth = true)::int AS preterm_birth,
        COUNT(*) FILTER (WHERE hypertension = true)::int AS hypertension,
        COUNT(*) FILTER (WHERE delivery_type = 'cesarean')::int AS cesarean_count,
        ROUND(AVG(ga_at_delivery))::int AS avg_ga
      FROM research_records
    `);

    const total: number = stats?.total ?? 0;
    if (total === 0) return { totalRecords: 0 };

    const conditions = ['preeclampsia', 'gestational_diabetes', 'hellp_syndrome', 'fgr', 'preterm_birth', 'hypertension'];
    const rates: Record<string, { count: number; percent: number }> = {};
    for (const c of conditions) {
      const count: number = stats[c] ?? 0;
      rates[c] = { count, percent: Math.round((count / total) * 100) };
    }

    return {
      totalRecords: total,
      conditionRates: rates,
      cesareanRate: Math.round(((stats.cesarean_count ?? 0) / total) * 100),
      averageGestationalAgeDays: stats.avg_ga ?? null,
    };
  }

  private async getRiskDistribution() {
    const total = await this.repo.count();
    const highRisk = await this.repo.createQueryBuilder('r')
      .where('r.preeclampsia = true OR r.hellp_syndrome = true OR r.fgr = true OR r.preterm_birth = true OR r.gestational_diabetes = true')
      .getCount();
    const lowRisk = total - highRisk;

    return {
      total,
      highRisk: { count: highRisk, percent: total > 0 ? Math.round((highRisk / total) * 100) : 0 },
      lowRisk: { count: lowRisk, percent: total > 0 ? Math.round((lowRisk / total) * 100) : 0 },
    };
  }

  private async getConditionRate(column: string) {
    const total = await this.repo.count();
    const count = await this.repo.count({ where: { [column]: true } as any });

    // By age group
    const byAge = await this.repo.createQueryBuilder('r')
      .select('r.age_group', 'ageGroup')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN r.${column} = true THEN 1 ELSE 0 END)`, 'affected')
      .groupBy('r.age_group')
      .getRawMany();

    // By region
    const byRegion = await this.repo.createQueryBuilder('r')
      .select('r.region', 'region')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN r.${column} = true THEN 1 ELSE 0 END)`, 'affected')
      .where('r.region IS NOT NULL')
      .groupBy('r.region')
      .getRawMany();

    return {
      total,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      byAgeGroup: byAge.map((r) => ({
        ageGroup: r.ageGroup,
        total: Number(r.total),
        affected: Number(r.affected),
        percent: Number(r.total) > 0 ? Math.round((Number(r.affected) / Number(r.total)) * 100) : 0,
      })),
      byRegion: byRegion.map((r) => ({
        region: r.region,
        total: Number(r.total),
        affected: Number(r.affected),
        percent: Number(r.total) > 0 ? Math.round((Number(r.affected) / Number(r.total)) * 100) : 0,
      })),
    };
  }

  private async getAgeDistribution() {
    const raw = await this.repo.createQueryBuilder('r')
      .select('r.age_group', 'ageGroup')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.age_group')
      .orderBy('r.age_group', 'ASC')
      .getRawMany();
    return raw.map((r) => ({ ageGroup: r.ageGroup, count: Number(r.count) }));
  }

  private async getBmiDistribution() {
    const raw = await this.repo.createQueryBuilder('r')
      .select(`CASE
        WHEN r.bmi < 18.5 THEN 'underweight'
        WHEN r.bmi < 25 THEN 'normal'
        WHEN r.bmi < 30 THEN 'overweight'
        ELSE 'obese' END`, 'category')
      .addSelect('COUNT(*)', 'count')
      .where('r.bmi IS NOT NULL')
      .groupBy('category')
      .getRawMany();
    return raw.map((r) => ({ category: r.category, count: Number(r.count) }));
  }

  private async getDeliveryTypes() {
    const raw = await this.repo.createQueryBuilder('r')
      .select('r.delivery_type', 'deliveryType')
      .addSelect('COUNT(*)', 'count')
      .where('r.delivery_type IS NOT NULL')
      .groupBy('r.delivery_type')
      .getRawMany();
    return raw.map((r) => ({ deliveryType: r.deliveryType, count: Number(r.count) }));
  }

  private async getCesareanRate() {
    const total = await this.repo.count({ where: { deliveryType: 'cesarean' } });
    const all = await this.repo.count();
    return { cesarean: total, total: all, percent: all > 0 ? Math.round((total / all) * 100) : 0 };
  }

  private async getRegionalDistribution() {
    const raw = await this.repo.createQueryBuilder('r')
      .select('r.region', 'region')
      .addSelect('r.state', 'state')
      .addSelect('COUNT(*)', 'count')
      .where('r.region IS NOT NULL')
      .groupBy('r.region')
      .addGroupBy('r.state')
      .orderBy('count', 'DESC')
      .getRawMany();
    return raw.map((r) => ({ region: r.region, state: r.state, count: Number(r.count) }));
  }

  private async getActiveVsCompleted() {
    const active = await this.pregnancyRepo.count({ where: { status: 'active' as any } });
    const completed = await this.pregnancyRepo.count({ where: { status: 'completed' as any } });
    return { active, completed, total: active + completed };
  }
}
