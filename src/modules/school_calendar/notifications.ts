/**
 * school_calendar — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'school_calendar.event.upcoming',
    module: 'school_calendar',
    titleKey: 'school_calendar.notif.event_upcoming.title',
    bodyKey: 'school_calendar.notif.event_upcoming.body',
    icon: 'calendar',
    severity: 'info',
    actions: [],
    linkHref: '/backend/school-calendar',
  },
]

export default notificationTypes
