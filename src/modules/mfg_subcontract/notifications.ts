import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_subcontract.completed',     module: 'mfg_subcontract', titleKey: 'mfg_subcontract.notif.completed.title',  bodyKey: 'mfg_subcontract.notif.completed.body',  icon: 'package',        severity: 'success', actions: [], linkHref: '/backend/mfg-subcontract' },
  { type: 'mfg_subcontract.scrap_exceeded', module: 'mfg_subcontract', titleKey: 'mfg_subcontract.notif.scrap.title',      bodyKey: 'mfg_subcontract.notif.scrap.body',      icon: 'alert-triangle', severity: 'warning', actions: [], linkHref: '/backend/mfg-subcontract' },
]
export default notificationTypes
