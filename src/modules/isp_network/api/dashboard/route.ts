/**
 * GET /api/isp-network/dashboard
 * KPIs de infraestructura: nodos por estado, stock CPE, alertas de capacidad.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_network.view'] },
}

export async function GET(_request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const [nodeSummary, cpeSummary] = await Promise.all([
    // Nodos por estado
    kysely
      .selectFrom('isp_network_nodes')
      .select(['status', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .groupBy('status')
      .execute(),

    // CPE por estado
    kysely
      .selectFrom('isp_cpe_inventory')
      .select(['status', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .groupBy('status')
      .execute(),
  ])

  const nodeMap: Record<string, number> = {}
  for (const row of nodeSummary as any[]) {
    nodeMap[row.status] = Number(row.count)
  }

  const cpeMap: Record<string, number> = {}
  for (const row of cpeSummary as any[]) {
    cpeMap[row.status] = Number(row.count)
  }

  return Response.json({
    nodes: {
      active:      nodeMap.active      ?? 0,
      degraded:    nodeMap.degraded    ?? 0,
      offline:     nodeMap.offline     ?? 0,
      maintenance: nodeMap.maintenance ?? 0,
      total: Object.values(nodeMap).reduce((a, b) => a + b, 0),
    },
    cpe: {
      in_stock:    cpeMap.in_stock    ?? 0,
      deployed:    cpeMap.deployed    ?? 0,
      in_repair:   cpeMap.in_repair   ?? 0,
      written_off: cpeMap.written_off ?? 0,
      total: Object.values(cpeMap).reduce((a, b) => a + b, 0),
    },
  })
}

export const openApi = {}
