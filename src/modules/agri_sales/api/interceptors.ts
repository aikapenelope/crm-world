import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'agri_sales.order-created',
    targetRoute: 'agri-sales/sale-orders',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_req, _res, ctx) {
      await emitLifecycle(eventsConfig, 'agri_sales.order.created', {
        tenantId: ctx.tenantId, organizationId: ctx.organizationId,
      })
      return {}
    },
  },
]
