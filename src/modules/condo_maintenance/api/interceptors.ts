/**
 * condo_maintenance API interceptors.
 * Emit lifecycle events when a maintenance request changes status via PUT
 * so the kanban board and alert counters update in real-time.
 *
 * - request.assigned: fires when the PUT body sets an assigned_to value
 * - request.completed: fires when the PUT body sets status → 'completed'
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'condo_maintenance.request-status-broadcast',
    targetRoute: 'condo-maintenance/requests',
    methods: ['PUT'],
    priority: 10,
    async before(request) {
      const newStatus = typeof request.body?.status === 'string'
        ? (request.body.status as string)
        : null
      const assignedTo = request.body?.assigned_to ?? null
      return { ok: true, metadata: { newStatus, assignedTo } }
    },
    async after(_request, _response, context) {
      const scope = { tenantId: context.tenantId, organizationId: context.organizationId }
      const { newStatus, assignedTo } = (context.metadata ?? {}) as Record<string, unknown>

      if (assignedTo) {
        await emitLifecycle(eventsConfig, 'condo_maintenance.request.assigned', scope)
      }
      if (newStatus === 'completed') {
        await emitLifecycle(eventsConfig, 'condo_maintenance.request.completed', scope)
      }
      return {}
    },
  },
]
