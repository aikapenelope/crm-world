/**
 * academy_groups — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'academy_groups.group.capacity_reached',
    module: 'academy_groups',
    titleKey: 'academy_groups.notif.capacity_reached.title',
    bodyKey: 'academy_groups.notif.capacity_reached.body',
    icon: 'users',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/academy-groups',
  },
]

export default notificationTypes
