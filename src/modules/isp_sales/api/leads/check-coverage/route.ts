/**
 * POST /api/isp-sales/leads/check-coverage
 * Verifica si una ciudad tiene cobertura y actualiza el lead.
 */
import { z } from 'zod'

const bodySchema = z.object({
  lead_id: z.string().uuid(),
  city: z.string().min(1),
})

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_sales.view'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { lead_id, city } = parsed.data

  // Buscar zona de cobertura que coincida con la ciudad
  const zone = await kysely
    .selectFrom('isp_coverage_zones')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('city', 'ilike', `%${city}%`)
    .where('has_coverage', '=', true)
    .executeTakeFirst()

  const coverageStatus = zone ? 'covered' : 'not_covered'
  const now = new Date()

  await kysely.updateTable('isp_leads').set({
    coverage_status: coverageStatus,
    coverage_zone_id: zone ? (zone as any).id : null,
    status: zone ? 'quoted' : 'coverage_check',
    updated_at: now,
  }).where('id', '=', lead_id).execute()

  return Response.json({
    coverage_status: coverageStatus,
    zone_name: zone ? (zone as any).name : null,
    technology: zone ? (zone as any).technology_available : null,
    max_speed_mbps: zone ? (zone as any).max_speed_mbps : null,
  })
}

export const openApi = {}
