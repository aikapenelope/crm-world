import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_mrp.run_completed',   module: 'mfg_mrp', titleKey: 'mfg_mrp.notif.run_completed.title',   bodyKey: 'mfg_mrp.notif.run_completed.body',   icon: 'check-circle',    severity: 'success', actions: [], linkHref: '/backend/mfg-mrp' },
  { type: 'mfg_mrp.at_risk_import',  module: 'mfg_mrp', titleKey: 'mfg_mrp.notif.at_risk.title',         bodyKey: 'mfg_mrp.notif.at_risk.body',         icon: 'alert-triangle',  severity: 'error',   actions: [], linkHref: '/backend/mfg-mrp' },
  { type: 'mfg_mrp.po_date_overdue', module: 'mfg_mrp', titleKey: 'mfg_mrp.notif.overdue.title',         bodyKey: 'mfg_mrp.notif.overdue.body',         icon: 'clock',           severity: 'error',   actions: [], linkHref: '/backend/mfg-mrp' },
]
export default notificationTypes
