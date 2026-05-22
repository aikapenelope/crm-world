/**
 * isp_billing — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'isp_billing.invoice_generated',
    module: 'isp_billing',
    titleKey: 'isp_billing.notif.invoice_generated.title',
    bodyKey: 'isp_billing.notif.invoice_generated.body',
    icon: 'file-text',
    severity: 'info',
    actions: [],
    linkHref: '/backend/isp-billing',
  },
  {
    type: 'isp_billing.payment_received',
    module: 'isp_billing',
    titleKey: 'isp_billing.notif.payment_received.title',
    bodyKey: 'isp_billing.notif.payment_received.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-billing',
  },
  {
    type: 'isp_billing.invoice_overdue',
    module: 'isp_billing',
    titleKey: 'isp_billing.notif.invoice_overdue.title',
    bodyKey: 'isp_billing.notif.invoice_overdue.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/isp-billing',
  },
  {
    type: 'isp_billing.service_cut',
    module: 'isp_billing',
    titleKey: 'isp_billing.notif.service_cut.title',
    bodyKey: 'isp_billing.notif.service_cut.body',
    icon: 'alert-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/isp-subscribers',
  },
  {
    type: 'isp_billing.service_reconnected',
    module: 'isp_billing',
    titleKey: 'isp_billing.notif.service_reconnected.title',
    bodyKey: 'isp_billing.notif.service_reconnected.body',
    icon: 'zap',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-subscribers',
  },
]

export default notificationTypes
