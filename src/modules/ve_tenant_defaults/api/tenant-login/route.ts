/**
 * Tenant Login Redirect
 *
 * GET /api/ve_tenant_defaults/tenant-login?slug=inmobiliaria-abc
 *
 * Resolves an organization slug to its tenantId and redirects
 * to the login page with the tenantId pre-filled.
 *
 * This allows giving clients a friendly URL:
 * https://mercato.novaincs.com/api/ve_tenant_defaults/tenant-login?slug=mi-inmobiliaria
 *
 * Which redirects to:
 * /backend/login?tenantId=UUID
 */
import type { EntityManager } from '@mikro-orm/core'

export const metadata = {
  GET: { requireAuth: false },
}

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')

  if (!slug) {
    return Response.json({ error: 'slug parameter required' }, { status: 400 })
  }

  const em: EntityManager = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  // Find organization by slug
  const org = await kysely
    .selectFrom('organizations')
    .select(['id', 'tenant_id', 'name', 'slug'])
    .where('slug', '=', slug)
    .where('is_active', '=', true)
    .executeTakeFirst()

  if (!org) {
    return Response.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Redirect to login with tenantId
  const loginUrl = `/backend?tenantId=${org.tenant_id}`

  return new Response(null, {
    status: 302,
    headers: { Location: loginUrl },
  })
}

export const openApi = {}
