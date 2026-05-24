/**
 * const_materials — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_materials.order.delivered',
    module: 'const_materials',
    titleKey: 'const_materials.notif.order_delivered.title',
    bodyKey: 'const_materials.notif.order_delivered.body',
    icon: 'package',
    severity: 'success',
    actions: [],
    linkHref: '/backend/const-materials',
  },
  {
    type: 'const_materials.order.delayed',
    module: 'const_materials',
    titleKey: 'const_materials.notif.order_delayed.title',
    bodyKey: 'const_materials.notif.order_delayed.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/const-materials',
  },
]

export default notificationTypes
