/**
 * condo_fees — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'condo_fees.receipt_overdue',
    module: 'condo_fees',
    titleKey: 'condo_fees.notif.receipt_overdue.title',
    bodyKey: 'condo_fees.notif.receipt_overdue.body',
    icon: 'alert-circle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/condo-fees',
  },
  {
    type: 'condo_fees.receipt_paid',
    module: 'condo_fees',
    titleKey: 'condo_fees.notif.receipt_paid.title',
    bodyKey: 'condo_fees.notif.receipt_paid.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/condo-fees',
  },
  {
    type: 'condo_fees.receipts_generated',
    module: 'condo_fees',
    titleKey: 'condo_fees.notif.receipts_generated.title',
    bodyKey: 'condo_fees.notif.receipts_generated.body',
    icon: 'file-text',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-fees',
  },
  {
    type: 'condo_fees.payment_reminder',
    module: 'condo_fees',
    titleKey: 'condo_fees.notif.payment_reminder.title',
    bodyKey: 'condo_fees.notif.payment_reminder.body',
    icon: 'clock',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-fees',
  },
]

export default notificationTypes
