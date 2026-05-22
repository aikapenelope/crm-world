/**
 * isp_subscribers — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'isp_subscribers.service_activated',
    module: 'isp_subscribers',
    titleKey: 'isp_subscribers.notif.service_activated.title',
    bodyKey: 'isp_subscribers.notif.service_activated.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-subscribers',
  },
  {
    type: 'isp_subscribers.service_suspended',
    module: 'isp_subscribers',
    titleKey: 'isp_subscribers.notif.service_suspended.title',
    bodyKey: 'isp_subscribers.notif.service_suspended.body',
    icon: 'alert-circle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/isp-subscribers',
  },
  {
    type: 'isp_subscribers.service_reconnected',
    module: 'isp_subscribers',
    titleKey: 'isp_subscribers.notif.service_reconnected.title',
    bodyKey: 'isp_subscribers.notif.service_reconnected.body',
    icon: 'zap',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-subscribers',
  },
]

export default notificationTypes
