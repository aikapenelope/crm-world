import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailPricingRuleEntity } from '../../data/entities'
import { createPricingRuleSchema, updatePricingRuleSchema, listPricingRulesSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_pricing.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_pricing.rules'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_pricing.rules'] },
  DELETE: { requireAuth: true, requireFeatures: ['retail_pricing.rules'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailPricingRuleEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  list: { schema: listPricingRulesSchema },
  create: {
    schema: createPricingRuleSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updatePricingRuleSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
