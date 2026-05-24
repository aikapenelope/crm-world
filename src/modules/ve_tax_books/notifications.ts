/**
 * ve_tax_books — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 've_tax_books.book.period_closed',
    module: 've_tax_books',
    titleKey: 've_tax_books.notif.period_closed.title',
    bodyKey: 've_tax_books.notif.period_closed.body',
    icon: 'book-open',
    severity: 'info',
    actions: [],
    linkHref: '/backend/ve-tax-books',
  },
]

export default notificationTypes
