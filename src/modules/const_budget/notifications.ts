/**
 * const_budget — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_budget.item.approved',
    module: 'const_budget',
    titleKey: 'const_budget.notif.item_approved.title',
    bodyKey: 'const_budget.notif.item_approved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/const-budget',
  },

export default notificationTypes
