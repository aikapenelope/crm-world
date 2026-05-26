import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgEnergyCostEntity } from '../../data/entities'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_energy.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_energy.record'] } }
export const metadata = routeMetadata
const createSchema = z.object({
  production_order_id: z.string().uuid(), order_number: z.string().min(1).max(50), product_code: z.string().min(1).max(100),
  actual_quantity: z.string(), uom: z.string().max(20),
  total_kwh: z.string(), grid_kwh: z.string(), generator_kwh: z.string(),
  total_energy_cost_usd: z.string(), energy_cost_per_unit_usd: z.string(),
  grid_cost_usd: z.string(), generator_cost_usd: z.string(), generator_premium_usd: z.string(),
  period_start: z.coerce.date(), period_end: z.coerce.date(), notes: z.string().optional().nullable(),
})
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgEnergyCostEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_energy:cost' },
  list: { schema: z.object({ production_order_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: createSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: createSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const openApi = {}
