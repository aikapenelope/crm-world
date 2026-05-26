import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgEnergyWindowEntity } from '../../data/entities'
import { energyWindowCreateSchema, energyWindowUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_planning.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgEnergyWindowEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_planning:energy_window' },
  list: { schema: z.object({ zone: z.string().optional(), restriction_type: z.string().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: energyWindowCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: energyWindowUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
