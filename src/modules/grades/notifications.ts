/**
 * grades — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'grades.report_card.published',
    module: 'grades',
    titleKey: 'grades.notif.report_card_published.title',
    bodyKey: 'grades.notif.report_card_published.body',
    icon: 'file-text',
    severity: 'success',
    actions: [],
    linkHref: '/backend/grades',
  },
]

export default notificationTypes
