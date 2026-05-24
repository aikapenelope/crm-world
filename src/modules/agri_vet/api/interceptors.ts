import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'agri_vet.medication-prescribed',
    targetRoute: 'agri-vet/medication-records',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_request, _response, context) {
      await emitLifecycle(eventsConfig, 'agri_vet.medication.prescribed', {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
      })
      return {}
    },
  },
  {
    id: 'agri_vet.vaccination-applied',
    targetRoute: 'agri-vet/vaccination-records',
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_request, _response, context) {
      await emitLifecycle(eventsConfig, 'agri_vet.vaccination.applied', {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
      })
      return {}
    },
  },
]
