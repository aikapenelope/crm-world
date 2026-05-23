import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'agri_units.flock-started',
    targetRoute: 'agri-units/flocks',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_request, _response, context) {
      await emitLifecycle(eventsConfig, 'agri_units.flock.started', {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
      })
      return {}
    },
  },
  {
    id: 'agri_units.weekly-recorded',
    targetRoute: 'agri-units/flock-weekly-records',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_request, _response, context) {
      await emitLifecycle(eventsConfig, 'agri_units.flock.weekly_recorded', {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
      })
      return {}
    },
  },
]
