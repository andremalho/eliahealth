import { ForbiddenException } from '@nestjs/common';
import type { Repository, ObjectLiteral } from 'typeorm';

/**
 * Builds a where clause that includes tenantId filtering when available.
 * If tenantId is null (e.g. superadmin), no tenant filter is applied.
 */
export function withTenant(
  where: Record<string, unknown>,
  tenantId: string | null,
): Record<string, unknown> {
  if (tenantId) {
    return { ...where, tenantId };
  }
  return where;
}

/**
 * Verifies that a pregnancy belongs to the given tenant.
 * Uses a single JOIN query: pregnancy → patient → tenantId.
 * Skips check if tenantId is null (superadmin).
 */
export async function verifyPregnancyTenant(
  repo: Repository<ObjectLiteral>,
  pregnancyId: string,
  tenantId: string | null,
): Promise<void> {
  if (!tenantId) return;
  const [row] = await (repo as any).query(
    `SELECT p.tenant_id FROM pregnancies preg
     JOIN patients p ON p.id = preg.patient_id
     WHERE preg.id = $1`,
    [pregnancyId],
  );
  if (row && row.tenant_id !== tenantId) {
    throw new ForbiddenException('Acesso negado');
  }
}

/**
 * Verifies ownership of a sub-resource (consultation, lab_result, vaccine, etc.)
 * by checking: sub_resource.pregnancy_id → pregnancy → patient.tenant_id.
 * Skips check if tenantId is null (superadmin).
 */
export async function verifySubResourceTenant(
  repo: Repository<ObjectLiteral>,
  table: string,
  resourceId: string,
  tenantId: string | null,
): Promise<void> {
  if (!tenantId) return;
  const [row] = await (repo as any).query(
    `SELECT p.tenant_id FROM "${table}" r
     JOIN pregnancies preg ON preg.id = r.pregnancy_id
     JOIN patients p ON p.id = preg.patient_id
     WHERE r.id = $1`,
    [resourceId],
  );
  if (row && row.tenant_id !== tenantId) {
    throw new ForbiddenException('Acesso negado');
  }
}
