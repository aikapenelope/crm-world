/**
 * retail_returns — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'retail_returns.return.approved',
    module: 'retail_returns',
    titleKey: 'retail_returns.notif.return_approved.title',
    bodyKey: 'retail_returns.notif.return_approved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/retail-returns',
  },
  {
    type: 'retail_returns.return.rejected',
    module: 'retail_returns',
    titleKey: 'retail_returns.notif.return_rejected.title',
    bodyKey: 'retail_returns.notif.return_rejected.body',
    icon: 'x-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/retail-returns',
  },

export default notificationTypes
