/**
 * dist_commissions — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'dist_commissions.commission.approved',
    module: 'dist_commissions',
    titleKey: 'dist_commissions.notif.commission_approved.title',
    bodyKey: 'dist_commissions.notif.commission_approved.body',
    icon: 'dollar-sign',
    severity: 'success',
    actions: [],
    linkHref: '/backend/dist-commissions',
  },

export default notificationTypes
