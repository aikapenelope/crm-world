/**
 * Tuition API interceptors.
 * After a payment is recorded via makeCrudRoute, emit the lifecycle event
 * so the tuition collection dashboard refreshes in real-time on all
 * connected browsers of this tenant.
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'tuition.payment-recorded-broadcast',
    targetRoute: 'tuition/payments',
    methods: ['POST'],
    priority: 10,
    async before() {
      return { ok: true }
    },
    async after(_request, _response, context) {
      // Fire after the payment row is created by makeCrudRoute.
      // clientBroadcast: true on tuition.payment.recorded means the
      // collection dashboard and the morosos list refresh instantly.
      await emitLifecycle(
        eventsConfig,
        'tuition.payment.recorded',
        { tenantId: context.tenantId, organizationId: context.organizationId },
      )
      return {}
    },
  },
  {
    id: 'tuition.charge-paid-broadcast',
    targetRoute: 'tuition/charges',
    methods: ['PUT'],
    priority: 10,
    async before(request) {
      const newStatus = typeof request.body?.status === 'string'
        ? (request.body.status as string)
        : null
      return { ok: true, metadata: { newStatus } }
    },
    async after(_request, _response, context) {
      const { newStatus } = (context.metadata ?? {}) as Record<string, unknown>
      if (newStatus === 'paid') {
        await emitLifecycle(
          eventsConfig,
          'tuition.charge.paid',
          { tenantId: context.tenantId, organizationId: context.organizationId },
        )
      }
      return {}
    },
  },
]
