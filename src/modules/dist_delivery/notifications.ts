/**
 * dist_delivery — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'dist_delivery.delivered',
    module: 'dist_delivery',
    titleKey: 'dist_delivery.notif.delivered.title',
    bodyKey: 'dist_delivery.notif.delivered.body',
    icon: 'package-check',
    severity: 'success',
    actions: [],
    linkHref: '/backend/dist-delivery',
  },
  {
    type: 'dist_delivery.failed',
    module: 'dist_delivery',
    titleKey: 'dist_delivery.notif.failed.title',
    bodyKey: 'dist_delivery.notif.failed.body',
    icon: 'alert-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/dist-delivery',
  },

export default notificationTypes
