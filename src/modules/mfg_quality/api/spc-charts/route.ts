import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgSpcChartEntity } from '../../data/entities'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_quality.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_quality.inspect'] },
}
export const metadata = routeMetadata

const createSchema = z.object({
  plan_id:           z.string().uuid(),
  subgroup_id:       z.string().min(1).max(50),
  subgroup_date:     z.coerce.date(),
  sample_count:      z.number().int().min(1),
  subgroup_mean:     z.string(),
  subgroup_range:    z.string(),
  subgroup_std:      z.string().optional().nullable(),
  is_out_of_control: z.boolean().default(false),
  rule_violated:     z.string().max(100).optional().nullable(),
})

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: MfgSpcChartEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'mfg_quality:spc_chart' },
  list: {
    schema: z.object({
      plan_id:   z.string().uuid().optional(),
      pageSize:  z.coerce.number().min(1).max(500).default(200),
    }).passthrough(),
  },
  create: { schema: createSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: createSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const openApi = {}
