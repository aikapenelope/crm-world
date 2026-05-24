import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'agri_feed.batch-produced',
    targetRoute: 'agri-feed/batches',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_request, _response, context) {
      await emitLifecycle(eventsConfig, 'agri_feed.batch.produced', {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
      })
      return {}
    },
  },
]
