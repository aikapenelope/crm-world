import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailCampaignEntity } from '../../data/entities'
import { createCampaignSchema, listCampaignsSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_loyalty.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_loyalty.campaigns'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_loyalty.campaigns'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailCampaignEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'retail_loyalty.campaign' },
  list: { schema: listCampaignsSchema },
  create: {
    schema: createCampaignSchema,
    mapToEntity: (input: any) => ({
      name: input.name,
      type: input.type,
      target_segment: input.target_segment,
      target_tier_id: input.target_tier_id ?? null,
      target_days_inactive: input.target_days_inactive ?? null,
      config: input.config ?? null,
      starts_at: new Date(input.starts_at),
      ends_at: input.ends_at ? new Date(input.ends_at) : null,
    }),
  },
  update: {
    schema: createCampaignSchema.partial(),
    applyToEntity: (entity: any, input: any) => {
      if (input.name) entity.name = input.name
      if (input.status) entity.status = input.status
      if (input.config) entity.config = input.config
      if (input.starts_at) entity.starts_at = new Date(input.starts_at)
      if (input.ends_at !== undefined) entity.ends_at = input.ends_at ? new Date(input.ends_at) : null
    },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
