const routeMetadata = {
  GET: { requireAuth: false },
}

export const metadata = routeMetadata

/**
 * Public catalog endpoint — returns available products for the storefront.
 * Reads from catalog_products (Open Mercato core) and dist_inventory_items.
 */
export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const pageSize = Math.min(Number(url.searchParams.get('pageSize') ?? '24'), 100)
  const category = url.searchParams.get('category') ?? undefined
  const search = url.searchParams.get('search') ?? undefined

  let query = kysely
    .selectFrom('catalog_products')
    .where('organization_id', '=', scope.organizationId)
    .where('tenant_id', '=', scope.tenantId)
    .where('is_active', '=', true)
    .where('deleted_at', 'is', null)

  if (category) {
    query = query.where('category_id', '=', category)
  }

  if (search) {
    query = query.where('title', 'ilike', `%${search}%`)
  }

  const items = await query
    .select(['id', 'title', 'subtitle', 'sku', 'handle'])
    .orderBy('title', 'asc')
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return Response.json({ items, page, pageSize })
}

export const openApi = {}
