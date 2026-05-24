/**
 * retail_purchasing — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'retail_purchasing.order.received',
    module: 'retail_purchasing',
    titleKey: 'retail_purchasing.notif.order_received.title',
    bodyKey: 'retail_purchasing.notif.order_received.body',
    icon: 'package',
    severity: 'success',
    actions: [],
    linkHref: '/backend/retail-purchasing',
  },
  {
    type: 'retail_purchasing.order.overdue',
    module: 'retail_purchasing',
    titleKey: 'retail_purchasing.notif.order_overdue.title',
    bodyKey: 'retail_purchasing.notif.order_overdue.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/retail-purchasing',
  },
]

export default notificationTypes
