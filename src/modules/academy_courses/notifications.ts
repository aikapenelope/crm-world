/**
 * academy_courses — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'academy_courses.course.started',
    module: 'academy_courses',
    titleKey: 'academy_courses.notif.course_started.title',
    bodyKey: 'academy_courses.notif.course_started.body',
    icon: 'book-open',
    severity: 'info',
    actions: [],
    linkHref: '/backend/academy-courses',
  },

export default notificationTypes
