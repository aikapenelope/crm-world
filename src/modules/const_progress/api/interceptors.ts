/**
 * const_progress API interceptors.
 * Emit lifecycle events when a valuation changes status via PUT so
 * the project team's dashboard updates in real-time.
 *
 * - valuation.paid: fires when PUT sets status → 'paid'
 * - valuation.rejected: fires when PUT sets status → 'rejected'
 *
 * Note: valuation.submitted and valuation.approved have dedicated custom
 * routes (api/valuations/submit and api/valuations/approve) that call
 * emitLifecycle directly.
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'const_progress.valuation-status-broadcast',
    targetRoute: 'const-progress/valuations',
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

      if (newStatus === 'paid') {
        await emitLifecycle(eventsConfig, 'const_progress.valuation.paid', scope)
      } else if (newStatus === 'rejected') {
        await emitLifecycle(eventsConfig, 'const_progress.valuation.rejected', scope)
      }
      return {}
    },
  },
]
