/**
 * bank_reconciliation — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'bank_reconciliation.statement.reconciled',
    module: 'bank_reconciliation',
    titleKey: 'bank_reconciliation.notif.reconciled.title',
    bodyKey: 'bank_reconciliation.notif.reconciled.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/bank-reconciliation',
  },
  {
    type: 'bank_reconciliation.discrepancy.detected',
    module: 'bank_reconciliation',
    titleKey: 'bank_reconciliation.notif.discrepancy.title',
    bodyKey: 'bank_reconciliation.notif.discrepancy.body',
    icon: 'alert-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/bank-reconciliation',
  },

export default notificationTypes
