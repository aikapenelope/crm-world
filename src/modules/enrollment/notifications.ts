/**
 * enrollment — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'enrollment.enrollment.registered',
    module: 'enrollment',
    titleKey: 'enrollment.notif.registered.title',
    bodyKey: 'enrollment.notif.registered.body',
    icon: 'user-plus',
    severity: 'info',
    actions: [],
    linkHref: '/backend/enrollment',
  },
]

export default notificationTypes
