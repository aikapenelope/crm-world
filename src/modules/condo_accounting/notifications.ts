/**
 * condo_accounting — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'condo_accounting.report.closed',
    module: 'condo_accounting',
    titleKey: 'condo_accounting.notif.report_closed.title',
    bodyKey: 'condo_accounting.notif.report_closed.body',
    icon: 'book-open',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-accounting',
  },
]

export default notificationTypes
