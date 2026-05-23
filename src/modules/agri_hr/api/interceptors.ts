import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'agri_hr.settlement-calculated',
    targetRoute: 'agri-hr/producer-settlements',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_req, _res, ctx) {
      await emitLifecycle(eventsConfig, 'agri_hr.settlement.calculated', {
        tenantId: ctx.tenantId, organizationId: ctx.organizationId,
      })
      return {}
    },
  },
]
