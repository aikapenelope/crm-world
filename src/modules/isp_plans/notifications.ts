/**
 * isp_plans — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'isp_plans.plan.deactivated',
    module: 'isp_plans',
    titleKey: 'isp_plans.notif.plan_deactivated.title',
    bodyKey: 'isp_plans.notif.plan_deactivated.body',
    icon: 'wifi',
    severity: 'info',
    actions: [],
    linkHref: '/backend/isp-plans',
  },

export default notificationTypes
