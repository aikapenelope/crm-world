import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// Read tools — query buildings, units, debtors, receipts
// =============================================================================

const listBuildings = defineAiTool({
  name: 'condo.list_buildings',
  description: 'List all buildings managed by this administrator. Returns name, code, total units, occupancy.',
  isMutation: false,
  requiredFeatures: ['condo_properties.view'],
  inputSchema: z.object({
    search: z.string().optional().describe('Filter by building name or code'),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('condo_buildings')
      .select(['id', 'name', 'code', 'building_type', 'city', 'total_units', 'is_active'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)
      .limit(args.limit)

    if (args.search) {
      query = query.where('name', 'ilike', `%${args.search}%`)
    }

    const buildings = await query.execute()
    return { buildings, total: (buildings as any[]).length }
  },
})

const listUnits = defineAiTool({
  name: 'condo.list_units',
  description: 'List units for a building. Shows unit number, type, aliquot, owner, status.',
  isMutation: false,
  requiredFeatures: ['condo_properties.view'],
  inputSchema: z.object({
    building_id: z.string().uuid().describe('Building ID to list units for'),
    status: z.enum(['occupied', 'vacant', 'for_sale', 'for_rent']).optional(),
    limit: z.number().int().min(1).max(100).default(50),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('condo_units')
      .select(['id', 'unit_number', 'unit_type', 'floor', 'aliquot_percent', 'owner_name', 'owner_phone', 'status'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('building_id', '=', args.building_id)
      .where('deleted_at', 'is', null)
      .limit(args.limit)

    if (args.status) {
      query = query.where('status', '=', args.status)
    }

    const units = await query.execute()
    return { units, total: (units as any[]).length }
  },
})

const getDebtors = defineAiTool({
  name: 'condo.get_debtors',
  description: 'Get list of debtors (morosos) with total debt and months overdue. Useful for "who owes money?" questions.',
  isMutation: false,
  requiredFeatures: ['condo_collections.view'],
  inputSchema: z.object({
    building_id: z.string().uuid().optional().describe('Filter by building'),
    min_months: z.number().int().min(1).optional().describe('Minimum months overdue'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('condo_receipts')
      .select(['unit_id', 'owner_name', 'unit_number', 'total_amount', 'paid_amount', 'due_date'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', 'in', ['pending', 'overdue', 'partial'])

    if (args.building_id) {
      query = query.where('building_id', '=', args.building_id)
    }

    const receipts = await query.execute()

    // Aggregate by unit
    const unitDebts = new Map<string, any>()
    for (const r of receipts as any[]) {
      const key = r.unit_id as string
      const debt = Number(r.total_amount) - Number(r.paid_amount)
      const existing = unitDebts.get(key)
      if (existing) {
        existing.total_debt += debt
        existing.receipt_count += 1
      } else {
        unitDebts.set(key, {
          unit_id: r.unit_id,
          owner_name: r.owner_name,
          unit_number: r.unit_number,
          total_debt: debt,
          receipt_count: 1,
          oldest_date: r.due_date,
        })
      }
    }

    const now = new Date()
    let debtors = Array.from(unitDebts.values())
      .filter((d) => d.total_debt > 0)
      .map((d) => {
        const oldest = new Date(d.oldest_date)
        const months = (now.getFullYear() - oldest.getFullYear()) * 12 + (now.getMonth() - oldest.getMonth())
        return { ...d, months_overdue: Math.max(0, months), total_debt: d.total_debt.toFixed(2) }
      })
      .sort((a, b) => b.months_overdue - a.months_overdue)

    if (args.min_months) {
      debtors = debtors.filter((d) => d.months_overdue >= args.min_months!)
    }

    const totalDebt = debtors.reduce((s, d) => s + Number(d.total_debt), 0)
    return { debtors, total_debtors: debtors.length, total_debt: totalDebt.toFixed(2), currency: 'USD' }
  },
})

const getFinancialSummary = defineAiTool({
  name: 'condo.get_financial_summary',
  description: 'Get financial summary: income, expenses, balance, reserve fund status. Answer "how are we doing financially?"',
  isMutation: false,
  requiredFeatures: ['condo_accounting.view'],
  inputSchema: z.object({
    building_id: z.string().uuid().optional(),
    period_month: z.string().optional().describe('Period in YYYY-MM format'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('condo_accounting_entries')
      .select(['entry_type', 'category', 'amount', 'is_reserve_fund'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.building_id) query = query.where('building_id', '=', args.building_id)
    if (args.period_month) query = query.where('period_month', '=', args.period_month)

    const entries = await query.execute()

    const income = (entries as any[]).filter((e: any) => e.entry_type === 'income').reduce((s: number, e: any) => s + Number(e.amount), 0)
    const expenses = (entries as any[]).filter((e: any) => e.entry_type === 'expense').reduce((s: number, e: any) => s + Number(e.amount), 0)
    const reserveFund = (entries as any[]).filter((e: any) => e.is_reserve_fund).reduce((s: number, e: any) => s + Number(e.amount), 0)

    return {
      total_income: income.toFixed(2),
      total_expenses: expenses.toFixed(2),
      net_balance: (income - expenses).toFixed(2),
      reserve_fund: reserveFund.toFixed(2),
      currency: 'USD',
    }
  },
})

const getMaintenanceStatus = defineAiTool({
  name: 'condo.get_maintenance_status',
  description: 'Get maintenance requests status: open, in progress, completed. Answer "what maintenance is pending?"',
  isMutation: false,
  requiredFeatures: ['condo_maintenance.view'],
  inputSchema: z.object({
    building_id: z.string().uuid().optional(),
    status: z.enum(['open', 'assigned', 'in_progress', 'completed']).optional(),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('condo_maintenance_requests')
      .select(['id', 'request_number', 'title', 'category', 'priority', 'status', 'assigned_to', 'created_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.building_id) query = query.where('building_id', '=', args.building_id)
    if (args.status) query = query.where('status', '=', args.status)

    const requests = await query.orderBy('created_at', 'desc').limit(20).execute()

    const summary = {
      open: (requests as any[]).filter((r: any) => r.status === 'open').length,
      in_progress: (requests as any[]).filter((r: any) => r.status === 'in_progress' || r.status === 'assigned').length,
      completed: (requests as any[]).filter((r: any) => r.status === 'completed').length,
    }

    return { requests, summary }
  },
})

const getUnitDebt = defineAiTool({
  name: 'condo.get_unit_debt',
  description: 'Get debt details for a specific unit. Answer "how much does unit 4-A owe?" or "what does apartment X owe?"',
  isMutation: false,
  requiredFeatures: ['condo_fees.view'],
  inputSchema: z.object({
    unit_number: z.string().describe('Unit number like "4-A", "PB-L3", "PH-1"'),
    building_id: z.string().uuid().optional(),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    // Find unit by number
    let unitQuery = kysely
      .selectFrom('condo_units')
      .select(['id', 'unit_number', 'owner_name', 'owner_phone', 'aliquot_percent', 'building_id'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('unit_number', 'ilike', args.unit_number)
      .where('deleted_at', 'is', null)

    if (args.building_id) unitQuery = unitQuery.where('building_id', '=', args.building_id)

    const unit = await unitQuery.executeTakeFirst()
    if (!unit) return { error: `Unit "${args.unit_number}" not found` }

    const u = unit as any

    // Get pending receipts
    const receipts = await kysely
      .selectFrom('condo_receipts')
      .select(['id', 'receipt_number', 'period_month', 'total_amount', 'paid_amount', 'status', 'due_date'])
      .where('unit_id', '=', u.id)
      .where('tenant_id', '=', ctx.tenantId)
      .where('status', 'in', ['pending', 'overdue', 'partial'])
      .orderBy('due_date', 'asc')
      .execute()

    const totalDebt = (receipts as any[]).reduce((s: number, r: any) => s + Number(r.total_amount) - Number(r.paid_amount), 0)

    return {
      unit: { unit_number: u.unit_number, owner_name: u.owner_name, owner_phone: u.owner_phone, aliquot_percent: u.aliquot_percent },
      pending_receipts: receipts,
      total_debt: totalDebt.toFixed(2),
      currency: 'USD',
    }
  },
})

// =============================================================================
// Mutation tools — generate fees, register payments
// =============================================================================

const generateFeeReceipts = defineAiTool({
  name: 'condo.generate_fee_receipts',
  description: 'Generate receipts for all units in a building for a fee configuration. Use when admin says "generate receipts for June" or "create the monthly fee".',
  isMutation: true,
  requiredFeatures: ['condo_fees.generate'],
  inputSchema: z.object({
    fee_config_id: z.string().uuid().describe('The fee configuration ID to generate receipts for'),
  }),
  async handler(args, ctx) {
    // Mutation tools must use prepareMutation in production
    // For now, return preview info for the approval card
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const config = await kysely
      .selectFrom('condo_fee_configs')
      .select(['id', 'name', 'building_id', 'base_amount', 'period_month', 'status'])
      .where('id', '=', args.fee_config_id)
      .where('tenant_id', '=', ctx.tenantId)
      .executeTakeFirst()

    if (!config) return { error: 'Fee configuration not found' }

    const c = config as any
    const unitCount = await kysely
      .selectFrom('condo_units')
      .select(['id'])
      .where('building_id', '=', c.building_id)
      .where('tenant_id', '=', ctx.tenantId)
      .where('deleted_at', 'is', null)
      .execute()

    return {
      action: 'generate_receipts',
      fee_config: { id: c.id, name: c.name, period: c.period_month, base_amount: c.base_amount },
      units_affected: (unitCount as any[]).length,
      message: `Will generate ${(unitCount as any[]).length} receipts for "${c.name}" (${c.period_month}), base amount $${c.base_amount}`,
      instructions: 'Use the /api/condo-fees/generate endpoint to execute this action.',
    }
  },
})

// =============================================================================
// Export all tools
// =============================================================================

export const aiTools = [
  listBuildings,
  listUnits,
  getDebtors,
  getFinancialSummary,
  getMaintenanceStatus,
  getUnitDebt,
  generateFeeReceipts,
]

export default aiTools
