/**
 * retail_pricing — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'retail_pricing.margin_violation',
    module: 'retail_pricing',
    titleKey: 'retail_pricing.notif.margin_violation.title',
    bodyKey: 'retail_pricing.notif.margin_violation.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/retail-pricing',
  },
]

export default notificationTypes
