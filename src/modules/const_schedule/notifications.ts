/**
 * const_schedule — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_schedule.task.delayed',
    module: 'const_schedule',
    titleKey: 'const_schedule.notif.task_delayed.title',
    bodyKey: 'const_schedule.notif.task_delayed.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/const-schedule',
  },

export default notificationTypes
