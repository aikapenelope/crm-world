import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgEnergyConsumptionEntity } from '../../data/entities'
import { energyConsumptionCreateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_energy.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_energy.record'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgEnergyConsumptionEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_energy:consumption' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(90), work_center_id: z.string().uuid().optional(), energy_source: z.string().optional() }).passthrough() },
  create: { schema: energyConsumptionCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: energyConsumptionCreateSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const openApi = {}
