/**
 * condo_comms API interceptors.
 * Emit lifecycle events when circulars are published or votes are opened via PUT
 * so the portal and backend dashboards update in real-time.
 *
 * - circular.published: fires when PUT sets status → 'published'
 * - vote.opened: fires when PUT sets status → 'open'
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'condo_comms.circular-published-broadcast',
    targetRoute: 'condo-comms/circulars',
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
      if (newStatus === 'published') {
        await emitLifecycle(
          eventsConfig,
          'condo_comms.circular.published',
          { tenantId: context.tenantId, organizationId: context.organizationId },
        )
      }
      return {}
    },
  },
  {
    id: 'condo_comms.vote-opened-broadcast',
    targetRoute: 'condo-comms/votes',
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
      if (newStatus === 'open') {
        await emitLifecycle(
          eventsConfig,
          'condo_comms.vote.opened',
          { tenantId: context.tenantId, organizationId: context.organizationId },
        )
      }
      return {}
    },
  },
]
