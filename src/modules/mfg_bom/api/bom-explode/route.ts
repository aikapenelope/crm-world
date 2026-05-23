/**
 * GET /api/mfg-bom/explode?bom_id=<uuid>&levels=3
 *
 * Explosión multinivel del BOM. Para manufactura discreta.
 * Devuelve el árbol completo de componentes con sus sub-BOMs resueltos.
 *
 * Usa recursión via Kysely con límite de profundidad configurable (default 5 niveles)
 * para evitar bucles en BOMs mal configurados.
 *
 * Retorna:
 * {
 *   bom_id, product_code, product_name, base_quantity, base_uom,
 *   lines: [
 *     { component_code, component_name, quantity, uom, scrap_pct, component_type,
 *       sub_bom: { ... } | null  // null si es materia prima sin BOM propio
 *     }
 *   ]
 * }
 */

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['mfg_bom.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const url    = new URL(request.url)
  const bomId  = url.searchParams.get('bom_id')
  const maxLevels = Math.min(5, Number(url.searchParams.get('levels') ?? '3'))

  if (!bomId) return Response.json({ error: 'bom_id is required' }, { status: 400 })

  async function explodeBom(id: string, level: number): Promise<any> {
    if (level > maxLevels) return null

    const header = await kysely
      .selectFrom('mfg_bom_headers')
      .select(['id', 'product_id', 'product_code', 'product_name', 'base_quantity', 'base_uom', 'bom_type', 'expected_yield_pct', 'version', 'status'])
      .where('id', '=', id)
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!header) return null

    const lines = await kysely
      .selectFrom('mfg_bom_lines')
      .selectAll()
      .where('bom_id', '=', id)
      .where('tenant_id', '=', scope.tenantId)
      .orderBy('line_number', 'asc')
      .execute()

    const resolvedLines = await Promise.all((lines as any[]).map(async (line: any) => {
      // If subassembly, look for its active BOM
      let subBom: any = null
      if (line.component_type === 'subassembly' && !line.is_phantom) {
        const subHeader = await kysely
          .selectFrom('mfg_bom_headers')
          .select(['id'])
          .where('product_id', '=', line.component_id)
          .where('tenant_id', '=', scope.tenantId)
          .where('status', '=', 'active')
          .where('deleted_at', 'is', null)
          .executeTakeFirst()
        if (subHeader) {
          subBom = await explodeBom((subHeader as any).id, level + 1)
        }
      }

      // Fetch alternatives for this line
      const alternatives = await kysely
        .selectFrom('mfg_bom_alternatives')
        .select(['alt_material_code', 'alt_material_name', 'conversion_factor', 'usage_condition'])
        .where('bom_line_id', '=', line.id)
        .where('tenant_id', '=', scope.tenantId)
        .where('is_active', '=', true)
        .execute()

      return {
        ...line,
        quantity_with_scrap: (Number(line.quantity) * (1 + Number(line.scrap_pct) / 100)).toFixed(6),
        alternatives: alternatives as any[],
        sub_bom: subBom,
        level,
      }
    }))

    return {
      ...(header as any),
      lines: resolvedLines,
      level,
    }
  }

  const result = await explodeBom(bomId, 1)
  if (!result) return Response.json({ error: 'BOM not found' }, { status: 404 })

  return Response.json({ bom: result, max_levels: maxLevels })
}

export const openApi = {}
