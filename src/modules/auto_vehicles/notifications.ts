/**
 * auto_vehicles — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'auto_vehicles.maintenance_due',
    module: 'auto_vehicles',
    titleKey: 'auto_vehicles.notif.maintenance_due.title',
    bodyKey: 'auto_vehicles.notif.maintenance_due.body',
    icon: 'wrench',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/auto-vehicles',
  },
]

export default notificationTypes
