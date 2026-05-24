/**
 * const_projects — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_projects.project.status_changed',
    module: 'const_projects',
    titleKey: 'const_projects.notif.status_changed.title',
    bodyKey: 'const_projects.notif.status_changed.body',
    icon: 'refresh-cw',
    severity: 'info',
    actions: [],
    linkHref: '/backend/const-projects',
  },
  {
    type: 'const_projects.project.completed',
    module: 'const_projects',
    titleKey: 'const_projects.notif.completed.title',
    bodyKey: 'const_projects.notif.completed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/const-projects',
  },
]

export default notificationTypes
