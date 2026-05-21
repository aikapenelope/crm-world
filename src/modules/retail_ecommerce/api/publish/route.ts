import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailSocialPublishEntity } from '../../data/entities'
import { createPublishSchema } from '../../data/validators'
import { z } from 'zod'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  platform: z.enum(['instagram', 'whatsapp', 'tiktok', 'facebook']).optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_ecommerce.publish'] },
  POST: { requireAuth: true, requireFeatures: ['retail_ecommerce.publish'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailSocialPublishEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'retail_ecommerce.publish' },
  list: { schema: listSchema },
  create: {
    schema: createPublishSchema,
    mapToEntity: (input: any) => ({
      product_id: input.product_id,
      platform: input.platform,
      content: input.content,
      hashtags: input.hashtags ?? null,
      image_urls: input.image_urls ?? null,
    }),
  },
})

export const GET = crud.GET
export const POST = crud.POST

export const openApi = {}
