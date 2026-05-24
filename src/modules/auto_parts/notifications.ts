/**
 * auto_parts — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'auto_parts.part.low_stock',
    module: 'auto_parts',
    titleKey: 'auto_parts.notif.low_stock.title',
    bodyKey: 'auto_parts.notif.low_stock.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/auto-parts',
  },
]

export default notificationTypes
