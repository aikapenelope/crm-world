/**
 * academy_instructors — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'academy_instructors.instructor.assigned',
    module: 'academy_instructors',
    titleKey: 'academy_instructors.notif.instructor_assigned.title',
    bodyKey: 'academy_instructors.notif.instructor_assigned.body',
    icon: 'user-check',
    severity: 'info',
    actions: [],
    linkHref: '/backend/academy-instructors',
  },
]

export default notificationTypes
