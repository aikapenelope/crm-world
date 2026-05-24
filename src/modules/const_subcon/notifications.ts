/**
 * const_subcon — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_subcon.payment.due',
    module: 'const_subcon',
    titleKey: 'const_subcon.notif.payment_due.title',
    bodyKey: 'const_subcon.notif.payment_due.body',
    icon: 'dollar-sign',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/const-subcon',
  },
]

export default notificationTypes
