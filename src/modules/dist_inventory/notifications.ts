/**
 * dist_inventory — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'dist_inventory.low_stock',
    module: 'dist_inventory',
    titleKey: 'dist_inventory.notif.low_stock.title',
    bodyKey: 'dist_inventory.notif.low_stock.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/dist-inventory',
  },
]

export default notificationTypes
