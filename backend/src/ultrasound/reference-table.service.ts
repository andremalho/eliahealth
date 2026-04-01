import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiometryReferenceTable } from './biometry-reference-table.entity.js';
import { BiometryParameter } from './biometry-parameter.enum.js';
import { CreateReferenceTableDto } from './dto/create-reference-table.dto.js';

export interface PercentileResult {
  parameter: string;
  value: number;
  gaWeeks: number;
  tableName: string;
  percentile: number;
  classification: 'critical_low' | 'low' | 'normal' | 'high' | 'critical_high';
  p5: number | null;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  p95: number | null;
}

@Injectable()
export class ReferenceTableService {
  constructor(
    @InjectRepository(BiometryReferenceTable)
    private readonly repo: Repository<BiometryReferenceTable>,
  ) {}

  // ── CRUD ──

  async create(dto: CreateReferenceTableDto): Promise<BiometryReferenceTable> {
    if (dto.isDefault) {
      await this.clearDefault(dto.parameter, dto.gestationalAgeWeeks);
    }
    const row = this.repo.create(dto);
    return this.repo.save(row);
  }

  async bulkImport(rows: CreateReferenceTableDto[]): Promise<{ imported: number }> {
    const entities = rows.map((dto) => this.repo.create(dto));
    await this.repo.save(entities);
    return { imported: entities.length };
  }

  async findAll(parameter?: BiometryParameter): Promise<BiometryReferenceTable[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (parameter) where.parameter = parameter;
    return this.repo.find({ where, order: { parameter: 'ASC', gestationalAgeWeeks: 'ASC' } });
  }

  async findOne(id: string): Promise<BiometryReferenceTable> {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException(`Tabela de referencia ${id} nao encontrada`);
    return row;
  }

  async update(id: string, dto: Partial<CreateReferenceTableDto>): Promise<BiometryReferenceTable> {
    const row = await this.findOne(id);
    Object.assign(row, dto);
    return this.repo.save(row);
  }

  async setDefault(id: string): Promise<BiometryReferenceTable> {
    const row = await this.findOne(id);
    await this.clearDefault(row.parameter, row.gestationalAgeWeeks);
    row.isDefault = true;
    return this.repo.save(row);
  }

  async deactivate(id: string): Promise<BiometryReferenceTable> {
    const row = await this.findOne(id);
    row.isActive = false;
    return this.repo.save(row);
  }

  // ── Cálculo de percentil ──

  async calculatePercentile(
    parameter: BiometryParameter,
    value: number,
    gaWeeks: number,
  ): Promise<PercentileResult> {
    const ref = await this.repo.findOne({
      where: { parameter, gestationalAgeWeeks: gaWeeks, isDefault: true, isActive: true },
    });

    if (!ref) {
      // Fallback: qualquer tabela ativa para esse parâmetro/IG
      const fallback = await this.repo.findOne({
        where: { parameter, gestationalAgeWeeks: gaWeeks, isActive: true },
      });
      if (!fallback) {
        return {
          parameter, value, gaWeeks,
          tableName: 'N/A', percentile: -1,
          classification: 'normal',
          p5: null, p10: null, p50: null, p90: null, p95: null,
        };
      }
      return this.computePercentile(fallback, value);
    }

    return this.computePercentile(ref, value);
  }

  /**
   * Calcula o percentil para uma medida de biometria fetal e retorna alertas.
   * Usado internamente pelo UltrasoundService ao salvar biometria.
   */
  async calculateBiometryPercentiles(
    gaWeeks: number,
    measures: { parameter: BiometryParameter; value: number }[],
  ): Promise<PercentileResult[]> {
    const results: PercentileResult[] = [];
    for (const m of measures) {
      results.push(await this.calculatePercentile(m.parameter, m.value, gaWeeks));
    }
    return results;
  }

  // ── Privados ──

  private computePercentile(ref: BiometryReferenceTable, value: number): PercentileResult {
    let percentile: number;

    // Se temos mean e sd, usar distribuição normal
    if (ref.mean != null && ref.sd != null) {
      const mean = Number(ref.mean);
      const sd = Number(ref.sd);
      const z = sd !== 0 ? (value - mean) / sd : 0;
      percentile = this.zToPercentile(z);
    } else {
      // Interpolar entre percentis conhecidos
      percentile = this.interpolatePercentile(ref, value);
    }

    let classification: PercentileResult['classification'];
    if (percentile < 3) classification = 'critical_low';
    else if (percentile < 10) classification = 'low';
    else if (percentile > 97) classification = 'critical_high';
    else if (percentile > 90) classification = 'high';
    else classification = 'normal';

    return {
      parameter: ref.parameter,
      value,
      gaWeeks: ref.gestationalAgeWeeks,
      tableName: ref.tableName,
      percentile: Math.round(percentile * 10) / 10,
      classification,
      p5: ref.p5 != null ? Number(ref.p5) : null,
      p10: ref.p10 != null ? Number(ref.p10) : null,
      p50: Number(ref.p50),
      p90: ref.p90 != null ? Number(ref.p90) : null,
      p95: ref.p95 != null ? Number(ref.p95) : null,
    };
  }

  private interpolatePercentile(ref: BiometryReferenceTable, value: number): number {
    const points: [number, number][] = [];
    if (ref.p5 != null) points.push([5, Number(ref.p5)]);
    if (ref.p10 != null) points.push([10, Number(ref.p10)]);
    if (ref.p25 != null) points.push([25, Number(ref.p25)]);
    points.push([50, Number(ref.p50)]);
    if (ref.p75 != null) points.push([75, Number(ref.p75)]);
    if (ref.p90 != null) points.push([90, Number(ref.p90)]);
    if (ref.p95 != null) points.push([95, Number(ref.p95)]);

    if (points.length < 2) return 50;

    // Abaixo do menor percentil
    if (value <= points[0][1]) return points[0][0] * (value / points[0][1]);
    // Acima do maior percentil
    const last = points[points.length - 1];
    if (value >= last[1]) return Math.min(99, last[0] + (100 - last[0]) * 0.5);

    // Interpolação linear entre pontos adjacentes
    for (let i = 0; i < points.length - 1; i++) {
      const [pLow, vLow] = points[i];
      const [pHigh, vHigh] = points[i + 1];
      if (value >= vLow && value <= vHigh) {
        const ratio = vHigh !== vLow ? (value - vLow) / (vHigh - vLow) : 0;
        return pLow + ratio * (pHigh - pLow);
      }
    }

    return 50;
  }

  private zToPercentile(z: number): number {
    // Aproximação da CDF normal (Abramowitz & Stegun)
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return (0.5 * (1.0 + sign * y)) * 100;
  }

  private async clearDefault(parameter: BiometryParameter, gaWeeks: number): Promise<void> {
    await this.repo.update(
      { parameter, gestationalAgeWeeks: gaWeeks, isDefault: true },
      { isDefault: false },
    );
  }
}
