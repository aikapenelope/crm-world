/**
 * retail_branches — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'retail_branches.low_stock_alert',
    module: 'retail_branches',
    titleKey: 'retail_branches.notif.low_stock_alert.title',
    bodyKey: 'retail_branches.notif.low_stock_alert.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/retail-branches',
  },
  {
    type: 'retail_branches.transfer.completed',
    module: 'retail_branches',
    titleKey: 'retail_branches.notif.transfer_completed.title',
    bodyKey: 'retail_branches.notif.transfer_completed.body',
    icon: 'truck',
    severity: 'success',
    actions: [],
    linkHref: '/backend/retail-branches',
  },
]

export default notificationTypes
