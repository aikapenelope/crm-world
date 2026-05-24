/**
 * isp_sales — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'isp_sales.lead.converted',
    module: 'isp_sales',
    titleKey: 'isp_sales.notif.lead_converted.title',
    bodyKey: 'isp_sales.notif.lead_converted.body',
    icon: 'trending-up',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-sales',
  },
  {
    type: 'isp_sales.commission.generated',
    module: 'isp_sales',
    titleKey: 'isp_sales.notif.commission_generated.title',
    bodyKey: 'isp_sales.notif.commission_generated.body',
    icon: 'dollar-sign',
    severity: 'info',
    actions: [],
    linkHref: '/backend/isp-sales/commissions',
  },
]

export default notificationTypes
