/**
 * isp_support — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'isp_support.ticket_assigned',
    module: 'isp_support',
    titleKey: 'isp_support.notif.ticket_assigned.title',
    bodyKey: 'isp_support.notif.ticket_assigned.body',
    icon: 'user-check',
    severity: 'info',
    actions: [],
    linkHref: '/backend/isp-support',
  },
  {
    type: 'isp_support.ticket_resolved',
    module: 'isp_support',
    titleKey: 'isp_support.notif.ticket_resolved.title',
    bodyKey: 'isp_support.notif.ticket_resolved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-support',
  },
  {
    type: 'isp_support.sla_breach',
    module: 'isp_support',
    titleKey: 'isp_support.notif.sla_breach.title',
    bodyKey: 'isp_support.notif.sla_breach.body',
    icon: 'clock',
    severity: 'error',
    actions: [],
    linkHref: '/backend/isp-support',
  },
  {
    type: 'isp_support.outage_detected',
    module: 'isp_support',
    titleKey: 'isp_support.notif.outage_detected.title',
    bodyKey: 'isp_support.notif.outage_detected.body',
    icon: 'alert-triangle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/isp-support/outages',
  },
  {
    type: 'isp_support.outage_resolved',
    module: 'isp_support',
    titleKey: 'isp_support.notif.outage_resolved.title',
    bodyKey: 'isp_support.notif.outage_resolved.body',
    icon: 'wifi',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-support/outages',
  },
]

export default notificationTypes
