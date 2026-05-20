/**
 * Bank Statement Upload API.
 * Receives parsed CSV data (bank transactions) and stores them
 * for reconciliation against registered payments.
 */
import { uploadStatementSchema } from '../../data/validators'
import { BankStatementEntity, BankTransactionEntity } from '../../data/entities'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['bank_reconciliation.upload'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const body = await request.json()

  const parsed = uploadStatementSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
  }

  const input = parsed.data

  // Create statement record
  const statement = em.create(BankStatementEntity, {
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    bank_code: input.bank_code,
    bank_name: input.bank_name,
    account_number: input.account_number || null,
    filename: input.filename,
    period_month: input.period_month,
    total_transactions: input.transactions.length,
    matched_count: 0,
    unmatched_count: 0,
    uploaded_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  } as any)
  em.persist(statement)

  // Create transaction records
  for (const tx of input.transactions) {
    const transaction = em.create(BankTransactionEntity, {
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
      statement_id: statement.id,
      transaction_date: new Date(tx.transaction_date),
      description: tx.description || null,
      reference: tx.reference || null,
      direction: tx.direction,
      amount: tx.amount,
      currency: tx.currency || 'VES',
      balance: tx.balance || null,
      reconciliation_status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    } as any)
    em.persist(transaction)
  }

  await em.flush()

  return Response.json({
    ok: true,
    statement_id: statement.id,
    transactions_count: input.transactions.length,
  })
}

export const openApi = {}
