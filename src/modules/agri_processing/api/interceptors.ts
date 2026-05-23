import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'agri_processing.lot-created',
    targetRoute: 'agri-processing/processing-lots',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_req, _res, ctx) {
      await emitLifecycle(eventsConfig, 'agri_processing.lot.created', {
        tenantId: ctx.tenantId, organizationId: ctx.organizationId,
      })
      return {}
    },
  },
]
