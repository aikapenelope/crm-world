/**
 * auto_service_orders API interceptors.
 * After a service order status changes via PUT, emit the lifecycle event
 * so the workshop kanban board and the pending-pickups counter refresh
 * in real-time across all connected browsers of this tenant.
 *
 * Only fires when the PUT body includes a 'status' field — avoids
 * noise from partial updates (e.g., editing notes without changing status).
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'auto_service_orders.status-changed-broadcast',
    targetRoute: 'auto-service-orders/orders',
    methods: ['PUT'],
    priority: 10,
    async before(request) {
      // Capture the new status from the body so the after hook can include
      // it in the event payload. Returns ok:true always — never blocks.
      const newStatus = typeof request.body?.status === 'string'
        ? request.body.status as string
        : null
      return { ok: true, metadata: { newStatus } }
    },
    async after(_request, _response, context) {
      const newStatus = context.metadata?.newStatus as string | null
      if (!newStatus) return {} // Not a status-change PUT — skip emit

      const eventId = newStatus === 'delivered'
        ? 'auto_service_orders.order.delivered'
        : newStatus === 'completed'
          ? 'auto_service_orders.order.completed'
          : 'auto_service_orders.order.status_changed'

      await emitLifecycle(
        eventsConfig,
        eventId,
        { tenantId: context.tenantId, organizationId: context.organizationId },
        { new_status: newStatus },
      )
      return {}
    },
  },
]
