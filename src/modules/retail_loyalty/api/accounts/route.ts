import { earnPointsSchema, redeemPointsSchema, listAccountsSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_loyalty.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_loyalty.adjust'] },
}

export const metadata = routeMetadata

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const params = listAccountsSchema.parse(Object.fromEntries(url.searchParams))

  const query = kysely
    .selectFrom('retail_loyalty_accounts')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)

  const filteredQuery = params.customer_id
    ? query.where('customer_id', '=', params.customer_id)
    : params.tier_id
      ? query.where('tier_id', '=', params.tier_id)
      : query

  const items = await filteredQuery
    .selectAll()
    .orderBy('lifetime_points', 'desc')
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize)
    .execute()

  return Response.json({ items })
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const body = await request.json()

  // Determine if earn or redeem based on action field
  const action = body.action as 'earn' | 'redeem'

  if (action === 'earn') {
    const input = earnPointsSchema.parse(body)

    // Get program
    const program = await kysely
      .selectFrom('retail_loyalty_programs')
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('is_active', '=', true)
      .selectAll()
      .executeTakeFirst()

    if (!program) {
      return Response.json({ error: 'No active loyalty program' }, { status: 400 })
    }

    // Calculate points
    const pointsEarned = Math.floor(input.amount_usd * Number(program.points_per_usd))

    // Get or create account
    let account = await kysely
      .selectFrom('retail_loyalty_accounts')
      .where('tenant_id', '=', scope.tenantId)
      .where('customer_id', '=', input.customer_id)
      .where('program_id', '=', program.id)
      .selectAll()
      .executeTakeFirst()

    if (!account) {
      await kysely
        .insertInto('retail_loyalty_accounts')
        .values({
          id: crypto.randomUUID(),
          tenant_id: scope.tenantId,
          organization_id: scope.organizationId,
          customer_id: input.customer_id,
          program_id: program.id,
          current_points: pointsEarned,
          lifetime_points: pointsEarned,
          last_activity_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        } as any)
        .execute()

      account = await kysely
        .selectFrom('retail_loyalty_accounts')
        .where('customer_id', '=', input.customer_id)
        .where('program_id', '=', program.id)
        .selectAll()
        .executeTakeFirst()
    } else {
      await kysely
        .updateTable('retail_loyalty_accounts')
        .set({
          current_points: (account as any).current_points + pointsEarned,
          lifetime_points: (account as any).lifetime_points + pointsEarned,
          last_activity_at: new Date(),
          updated_at: new Date(),
        } as any)
        .where('id', '=', (account as any).id)
        .execute()
    }

    // Record transaction
    const balanceAfter = ((account as any)?.current_points ?? 0) + pointsEarned
    await kysely
      .insertInto('retail_loyalty_transactions')
      .values({
        id: crypto.randomUUID(),
        tenant_id: scope.tenantId,
        organization_id: scope.organizationId,
        account_id: (account as any).id,
        type: 'earn',
        points: pointsEarned,
        balance_after: balanceAfter,
        reference_type: input.reference_type,
        reference_id: input.reference_id ?? null,
        description: input.description ?? `Compra de USD ${input.amount_usd}`,
        created_at: new Date(),
      } as any)
      .execute()

    return Response.json({ points_earned: pointsEarned, balance: balanceAfter })
  }

  if (action === 'redeem') {
    const input = redeemPointsSchema.parse(body)

    const account = await kysely
      .selectFrom('retail_loyalty_accounts')
      .where('tenant_id', '=', scope.tenantId)
      .where('customer_id', '=', input.customer_id)
      .selectAll()
      .executeTakeFirst()

    if (!account || (account as any).current_points < input.points) {
      return Response.json({ error: 'Insufficient points' }, { status: 400 })
    }

    const balanceAfter = (account as any).current_points - input.points
    await kysely
      .updateTable('retail_loyalty_accounts')
      .set({ current_points: balanceAfter, last_activity_at: new Date(), updated_at: new Date() } as any)
      .where('id', '=', (account as any).id)
      .execute()

    await kysely
      .insertInto('retail_loyalty_transactions')
      .values({
        id: crypto.randomUUID(),
        tenant_id: scope.tenantId,
        organization_id: scope.organizationId,
        account_id: (account as any).id,
        type: 'redeem',
        points: -input.points,
        balance_after: balanceAfter,
        reference_type: input.reference_type,
        reference_id: input.reference_id ?? null,
        description: input.description ?? `Canje de ${input.points} puntos`,
        created_at: new Date(),
      } as any)
      .execute()

    return Response.json({ points_redeemed: input.points, balance: balanceAfter })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}

export const openApi = {}
