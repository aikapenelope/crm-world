/**
 * Shared utility for loading organization branding in PDF API routes.
 * Fetches org name (and logo URL if available) from the organizations table.
 */
import type { OrgBranding } from './design'

export async function loadOrgBranding(
  kysely: any,
  scope: { tenantId: string; organizationId: string },
): Promise<OrgBranding> {
  const org = await kysely
    .selectFrom('organizations')
    .select(['name', 'id'])
    .where('id', '=', scope.organizationId)
    .executeTakeFirst()

  const name = (org as any)?.name ?? 'Academia / Empresa'

  // Try to get a logo URL from organization settings (if stored)
  // For now, use null — the design system shows initials when no logo
  let logoUrl: string | null = null

  return {
    name,
    logoUrl,
    rif: null,   // Can be added when org has RIF stored
    address: null,
    phone: null,
    email: null,
  }
}
