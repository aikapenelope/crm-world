/**
 * academy_sessions — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'academy_sessions.session.cancelled',
    module: 'academy_sessions',
    titleKey: 'academy_sessions.notif.session_cancelled.title',
    bodyKey: 'academy_sessions.notif.session_cancelled.body',
    icon: 'x-circle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/academy-sessions',
  },
]

export default notificationTypes
