/**
 * retail_inventory — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'retail_inventory.dead_stock.detected',
    module: 'retail_inventory',
    titleKey: 'retail_inventory.notif.dead_stock_detected.title',
    bodyKey: 'retail_inventory.notif.dead_stock_detected.body',
    icon: 'package-x',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/retail-inventory',
  },
  {
    type: 'retail_inventory.count.completed',
    module: 'retail_inventory',
    titleKey: 'retail_inventory.notif.count_completed.title',
    bodyKey: 'retail_inventory.notif.count_completed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/retail-inventory',
  },

export default notificationTypes
