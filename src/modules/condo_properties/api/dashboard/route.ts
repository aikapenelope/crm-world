/**
 * Condo Properties Dashboard API.
 * Aggregates KPIs: total buildings, units, occupancy, aliquot validation.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_properties.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // Buildings summary
  const buildings = await kysely
    .selectFrom('condo_buildings')
    .select(['id', 'name', 'total_units', 'is_active'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  const totalBuildings = (buildings as any[]).length
  const activeBuildings = (buildings as any[]).filter((b: any) => b.is_active).length

  // Units summary
  const units = await kysely
    .selectFrom('condo_units')
    .select(['id', 'building_id', 'status', 'aliquot_percent'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  const totalUnits = (units as any[]).length
  const occupiedUnits = (units as any[]).filter((u: any) => u.status === 'occupied').length
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  // Aliquot validation per building
  const buildingAliquots: Record<string, number> = {}
  for (const unit of units as any[]) {
    const bid = unit.building_id as string
    buildingAliquots[bid] = (buildingAliquots[bid] ?? 0) + Number(unit.aliquot_percent)
  }

  const aliquotWarnings = Object.entries(buildingAliquots)
    .filter(([, total]) => Math.abs(total - 100) > 0.01)
    .map(([buildingId, total]) => {
      const building = (buildings as any[]).find((b: any) => b.id === buildingId)
      return { building_id: buildingId, building_name: (building as any)?.name ?? '', total_aliquot: Number(total.toFixed(5)) }
    })

  // Common areas
  const commonAreas = await kysely
    .selectFrom('condo_common_areas')
    .select(['id', 'is_reservable'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .execute()

  const totalCommonAreas = (commonAreas as any[]).length
  const reservableAreas = (commonAreas as any[]).filter((a: any) => a.is_reservable).length

  const dashboard = {
    buildings: {
      total: totalBuildings,
      active: activeBuildings,
    },
    units: {
      total: totalUnits,
      occupied: occupiedUnits,
      vacant: totalUnits - occupiedUnits,
      occupancy_rate: occupancyRate,
    },
    aliquot_warnings: aliquotWarnings,
    common_areas: {
      total: totalCommonAreas,
      reservable: reservableAreas,
    },
  }

  return Response.json(dashboard)
}

export const openApi = {}
