import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgMrpRequirementEntity } from '../../data/entities'
import { mrpRequirementUpdateSchema } from '../../data/validators'

const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_mrp.view'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_mrp.run'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgMrpRequirementEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_mrp:requirement' },
  list: { schema: z.object({ plan_id: z.string().uuid().optional(), status: z.string().optional(), is_imported: z.coerce.boolean().optional(), pageSize: z.coerce.number().min(1).max(500).default(200) }).passthrough() },
  update: { schema: mrpRequirementUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const PUT = crud.PUT
export const openApi = {}
