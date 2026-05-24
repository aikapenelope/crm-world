/**
 * retail_loyalty — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'retail_loyalty.tier.upgraded',
    module: 'retail_loyalty',
    titleKey: 'retail_loyalty.notif.tier_upgraded.title',
    bodyKey: 'retail_loyalty.notif.tier_upgraded.body',
    icon: 'star',
    severity: 'success',
    actions: [],
    linkHref: '/backend/retail-loyalty',
  },
  {
    type: 'retail_loyalty.campaign.sent',
    module: 'retail_loyalty',
    titleKey: 'retail_loyalty.notif.campaign_sent.title',
    bodyKey: 'retail_loyalty.notif.campaign_sent.body',
    icon: 'send',
    severity: 'info',
    actions: [],
    linkHref: '/backend/retail-loyalty',
  },
]

export default notificationTypes
