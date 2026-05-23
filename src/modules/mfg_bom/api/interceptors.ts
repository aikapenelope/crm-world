import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'mfg_bom.created',
    targetRoute: 'mfg-bom/bom-headers',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_req, _res, ctx) {
      await emitLifecycle(eventsConfig, 'mfg_bom.created', {
        tenantId: ctx.tenantId, organizationId: ctx.organizationId,
      })
      return {}
    },
  },
]
