/**
 * dist_price_lists — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'dist_price_lists.list.updated',
    module: 'dist_price_lists',
    titleKey: 'dist_price_lists.notif.list_updated.title',
    bodyKey: 'dist_price_lists.notif.list_updated.body',
    icon: 'tag',
    severity: 'info',
    actions: [],
    linkHref: '/backend/dist-price-lists',
  },

export default notificationTypes
