/**
 * academy_enrollments — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'academy_enrollments.enrollment.created',
    module: 'academy_enrollments',
    titleKey: 'academy_enrollments.notif.enrollment_created.title',
    bodyKey: 'academy_enrollments.notif.enrollment_created.body',
    icon: 'user-plus',
    severity: 'info',
    actions: [],
    linkHref: '/backend/academy-enrollments',
  },
  {
    type: 'academy_enrollments.enrollment.withdrawn',
    module: 'academy_enrollments',
    titleKey: 'academy_enrollments.notif.enrollment_withdrawn.title',
    bodyKey: 'academy_enrollments.notif.enrollment_withdrawn.body',
    icon: 'user-minus',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/academy-enrollments',
  },

export default notificationTypes
