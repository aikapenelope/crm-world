/**
 * const_rfis API interceptors.
 * Emit lifecycle events when a submittal changes approval status via PUT
 * so the RFI list updates the badge in real-time.
 *
 * - submittal.approved: fires when PUT sets status → 'approved'
 * - submittal.rejected: fires when PUT sets status → 'rejected'
 *
 * Note: rfi.answered and rfi.overdue have dedicated handlers (custom route
 * and detect-overdue worker respectively).
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'const_rfis.submittal-status-broadcast',
    targetRoute: 'const-rfis/submittals',
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
      const scope = { tenantId: context.tenantId, organizationId: context.organizationId }

      if (newStatus === 'approved') {
        await emitLifecycle(eventsConfig, 'const_rfis.submittal.approved', scope)
      } else if (newStatus === 'rejected') {
        await emitLifecycle(eventsConfig, 'const_rfis.submittal.rejected', scope)
      }
      return {}
    },
  },
]
