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
