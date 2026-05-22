/**
 * school_comms — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'school_comms.announcement.published',
    module: 'school_comms',
    titleKey: 'school_comms.notif.announcement_published.title',
    bodyKey: 'school_comms.notif.announcement_published.body',
    icon: 'megaphone',
    severity: 'info',
    actions: [],
    linkHref: '/backend/school-comms',
  },

export default notificationTypes
