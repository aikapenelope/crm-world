/**
 * dist_routes — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'dist_routes.route.completed',
    module: 'dist_routes',
    titleKey: 'dist_routes.notif.route_completed.title',
    bodyKey: 'dist_routes.notif.route_completed.body',
    icon: 'map-pin',
    severity: 'success',
    actions: [],
    linkHref: '/backend/dist-routes',
  },
]

export default notificationTypes
