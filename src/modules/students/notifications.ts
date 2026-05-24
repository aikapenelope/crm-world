/**
 * students — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'students.student.graduated',
    module: 'students',
    titleKey: 'students.notif.graduated.title',
    bodyKey: 'students.notif.graduated.body',
    icon: 'graduation-cap',
    severity: 'success',
    actions: [],
    linkHref: '/backend/students',
  },
]

export default notificationTypes
