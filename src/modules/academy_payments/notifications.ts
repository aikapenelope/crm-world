/**
 * academy_payments — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'academy_payments.payment.confirmed',
    module: 'academy_payments',
    titleKey: 'academy_payments.notif.payment_confirmed.title',
    bodyKey: 'academy_payments.notif.payment_confirmed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/academy-payments',
  },
  {
    type: 'academy_payments.payment.overdue',
    module: 'academy_payments',
    titleKey: 'academy_payments.notif.payment_overdue.title',
    bodyKey: 'academy_payments.notif.payment_overdue.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/academy-payments',
  },
]

export default notificationTypes
