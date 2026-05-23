/**
 * payment_methods — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'payment_methods.method.deactivated',
    module: 'payment_methods',
    titleKey: 'payment_methods.notif.method_deactivated.title',
    bodyKey: 'payment_methods.notif.method_deactivated.body',
    icon: 'credit-card',
    severity: 'info',
    actions: [],
    linkHref: '/backend/payment-methods',
  },

export default notificationTypes
