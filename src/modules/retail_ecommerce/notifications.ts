/**
 * retail_ecommerce — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'retail_ecommerce.order.placed',
    module: 'retail_ecommerce',
    titleKey: 'retail_ecommerce.notif.order_placed.title',
    bodyKey: 'retail_ecommerce.notif.order_placed.body',
    icon: 'shopping-cart',
    severity: 'success',
    actions: [],
    linkHref: '/backend/retail-ecommerce',
  },
  {
    type: 'retail_ecommerce.catalog.published',
    module: 'retail_ecommerce',
    titleKey: 'retail_ecommerce.notif.catalog_published.title',
    bodyKey: 'retail_ecommerce.notif.catalog_published.body',
    icon: 'globe',
    severity: 'info',
    actions: [],
    linkHref: '/backend/retail-ecommerce',
  },

export default notificationTypes
