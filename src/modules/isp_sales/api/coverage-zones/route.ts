import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspCoverageZoneEntity } from '../../data/entities'
import { createCoverageZoneSchema, updateCoverageZoneSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(100),
  city: z.string().optional(),
  has_coverage: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_sales.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_sales.manage_coverage'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_sales.manage_coverage'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_sales.manage_coverage'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspCoverageZoneEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_sales.coverage_zone' },
  list: { schema: listSchema },
  create: { schema: createCoverageZoneSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateCoverageZoneSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
