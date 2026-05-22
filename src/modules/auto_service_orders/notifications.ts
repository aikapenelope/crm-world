/**
 * auto_service_orders — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'auto_service_orders.vehicle_ready',
    module: 'auto_service_orders',
    titleKey: 'auto_service_orders.notif.vehicle_ready.title',
    bodyKey: 'auto_service_orders.notif.vehicle_ready.body',
    icon: 'car',
    severity: 'success',
    actions: [],
    linkHref: '/backend/auto-service-orders',
  },
  {
    type: 'auto_service_orders.estimate_sent',
    module: 'auto_service_orders',
    titleKey: 'auto_service_orders.notif.estimate_sent.title',
    bodyKey: 'auto_service_orders.notif.estimate_sent.body',
    icon: 'file-text',
    severity: 'info',
    actions: [],
    linkHref: '/backend/auto-service-orders',
  },
  {
    type: 'auto_service_orders.inspection_complete',
    module: 'auto_service_orders',
    titleKey: 'auto_service_orders.notif.inspection_complete.title',
    bodyKey: 'auto_service_orders.notif.inspection_complete.body',
    icon: 'clipboard-check',
    severity: 'info',
    actions: [],
    linkHref: '/backend/auto-service-orders',
  },
  {
    type: 'auto_service_orders.status_changed',
    module: 'auto_service_orders',
    titleKey: 'auto_service_orders.notif.status_changed.title',
    bodyKey: 'auto_service_orders.notif.status_changed.body',
    icon: 'refresh-cw',
    severity: 'info',
    actions: [],
    linkHref: '/backend/auto-service-orders',
  },
  {
    type: 'auto_service_orders.maintenance_due',
    module: 'auto_service_orders',
    titleKey: 'auto_service_orders.notif.maintenance_due.title',
    bodyKey: 'auto_service_orders.notif.maintenance_due.body',
    icon: 'wrench',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/auto-vehicles',
  },
]

export default notificationTypes
