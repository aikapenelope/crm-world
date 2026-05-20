/**
 * Tax Reports Summary API.
 * Reads from ve_tax_book_entries and ve_withholding_records tables
 * to generate fiscal summaries for a given period.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['ve_tax_reports.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const url = new URL(request.url)
  const periodMonth = url.searchParams.get('period_month')

  if (!periodMonth) {
    return Response.json({ error: 'period_month is required' }, { status: 400 })
  }

  const kysely = (em as any).getKysely()

  // Fetch tax book entries for the period
  const taxEntries = await kysely
    .selectFrom('ve_tax_book_entries')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('period_month', '=', periodMonth)
    .where('deleted_at', 'is', null)
    .execute()

  // Fetch withholdings for the period
  const withholdings = await kysely
    .selectFrom('ve_withholding_records')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('period_month', '=', periodMonth)
    .where('deleted_at', 'is', null)
    .execute()

  // Calculate summaries
  const salesEntries = (taxEntries as any[]).filter((e: any) => e.book_type === 'sales')
  const purchaseEntries = (taxEntries as any[]).filter((e: any) => e.book_type === 'purchases')

  const salesTaxableBase = salesEntries.reduce((sum: number, e: any) => sum + Number(e.taxable_base), 0)
  const salesTaxAmount = salesEntries.reduce((sum: number, e: any) => sum + Number(e.tax_amount), 0)
  const salesIgtf = salesEntries.reduce((sum: number, e: any) => sum + Number(e.igtf_amount), 0)
  const salesTotalAmount = salesEntries.reduce((sum: number, e: any) => sum + Number(e.total_amount), 0)

  const purchasesTaxableBase = purchaseEntries.reduce((sum: number, e: any) => sum + Number(e.taxable_base), 0)
  const purchasesTaxAmount = purchaseEntries.reduce((sum: number, e: any) => sum + Number(e.tax_amount), 0)
  const purchasesIgtf = purchaseEntries.reduce((sum: number, e: any) => sum + Number(e.igtf_amount), 0)
  const purchasesTotalAmount = purchaseEntries.reduce((sum: number, e: any) => sum + Number(e.total_amount), 0)

  const ivaWithholdings = (withholdings as any[]).filter((w: any) => w.type === 'iva')
  const islrWithholdings = (withholdings as any[]).filter((w: any) => w.type === 'islr')

  const ivaWithholdingTotal = ivaWithholdings.reduce((sum: number, w: any) => sum + Number(w.withholding_amount), 0)
  const islrWithholdingTotal = islrWithholdings.reduce((sum: number, w: any) => sum + Number(w.withholding_amount), 0)

  const summary = {
    period_month: periodMonth,
    sales: {
      count: salesEntries.length,
      taxable_base: salesTaxableBase.toFixed(2),
      tax_amount: salesTaxAmount.toFixed(2),
      igtf_amount: salesIgtf.toFixed(2),
      total_amount: salesTotalAmount.toFixed(2),
    },
    purchases: {
      count: purchaseEntries.length,
      taxable_base: purchasesTaxableBase.toFixed(2),
      tax_amount: purchasesTaxAmount.toFixed(2),
      igtf_amount: purchasesIgtf.toFixed(2),
      total_amount: purchasesTotalAmount.toFixed(2),
    },
    iva: {
      debito_fiscal: salesTaxAmount.toFixed(2),
      credito_fiscal: purchasesTaxAmount.toFixed(2),
      iva_a_pagar: (salesTaxAmount - purchasesTaxAmount).toFixed(2),
    },
    igtf: {
      total: (salesIgtf + purchasesIgtf).toFixed(2),
    },
    withholdings: {
      iva_count: ivaWithholdings.length,
      iva_total: ivaWithholdingTotal.toFixed(2),
      islr_count: islrWithholdings.length,
      islr_total: islrWithholdingTotal.toFixed(2),
    },
    // Raw data for export
    sales_entries: salesEntries,
    purchase_entries: purchaseEntries,
    withholding_records: withholdings,
  }

  return Response.json(summary)
}

export const openApi = {}
