/**
 * dist_credit — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'dist_credit.account.overdue',
    module: 'dist_credit',
    titleKey: 'dist_credit.notif.account_overdue.title',
    bodyKey: 'dist_credit.notif.account_overdue.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/dist-credit',
  },
  {
    type: 'dist_credit.account.blocked',
    module: 'dist_credit',
    titleKey: 'dist_credit.notif.account_blocked.title',
    bodyKey: 'dist_credit.notif.account_blocked.body',
    icon: 'lock',
    severity: 'error',
    actions: [],
    linkHref: '/backend/dist-credit',
  },
]

export default notificationTypes
