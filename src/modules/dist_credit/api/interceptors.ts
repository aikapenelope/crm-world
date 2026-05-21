/**
 * dist_credit API interceptors.
 * After a credit transaction is created via makeCrudRoute, emit the
 * lifecycle event so the accounts receivable dashboard refreshes in
 * real-time — blocked/overdue badges update without a page reload.
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'dist_credit.transaction-created-broadcast',
    targetRoute: 'dist-credit/transactions',
    methods: ['POST'],
    priority: 10,
    async before() {
      return { ok: true }
    },
    async after(_request, _response, context) {
      await emitLifecycle(
        eventsConfig,
        'dist_credit.transaction.created',
        { tenantId: context.tenantId, organizationId: context.organizationId },
      )
      return {}
    },
  },
]
