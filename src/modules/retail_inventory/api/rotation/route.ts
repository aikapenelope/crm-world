import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailStockRotationEntity } from '../../data/entities'
import { listRotationSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_inventory.reports'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailStockRotationEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'retail_inventory.rotation' },
  list: { schema: listRotationSchema },
})

export const GET = crud.GET

export const openApi = {}
