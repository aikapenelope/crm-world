import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_procurement.at_customs',   module: 'mfg_procurement', titleKey: 'mfg_procurement.notif.customs.title',   bodyKey: 'mfg_procurement.notif.customs.body',   icon: 'anchor',         severity: 'info',    actions: [], linkHref: '/backend/mfg-procurement' },
  { type: 'mfg_procurement.delivered',    module: 'mfg_procurement', titleKey: 'mfg_procurement.notif.delivered.title', bodyKey: 'mfg_procurement.notif.delivered.body', icon: 'check-circle',   severity: 'success', actions: [], linkHref: '/backend/mfg-procurement' },
  { type: 'mfg_procurement.delay',        module: 'mfg_procurement', titleKey: 'mfg_procurement.notif.delay.title',     bodyKey: 'mfg_procurement.notif.delay.body',     icon: 'alert-triangle', severity: 'error',   actions: [], linkHref: '/backend/mfg-procurement' },
]
export default notificationTypes
