import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_costs.variance_unfavorable', module: 'mfg_costs', titleKey: 'mfg_costs.notif.unfavorable.title', bodyKey: 'mfg_costs.notif.unfavorable.body', icon: 'trending-up', severity: 'warning', actions: [], linkHref: '/backend/mfg-costs' },
]
export default notificationTypes
