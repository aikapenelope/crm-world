import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_maintenance.plan_overdue',        module: 'mfg_maintenance', titleKey: 'mfg_maintenance.notif.plan_overdue.title',   bodyKey: 'mfg_maintenance.notif.plan_overdue.body',   icon: 'alert-circle',    severity: 'warning', actions: [], linkHref: '/backend/mfg-maintenance' },
  { type: 'mfg_maintenance.spare_low',           module: 'mfg_maintenance', titleKey: 'mfg_maintenance.notif.spare_low.title',      bodyKey: 'mfg_maintenance.notif.spare_low.body',      icon: 'package',         severity: 'error',   actions: [], linkHref: '/backend/mfg-maintenance' },
  { type: 'mfg_maintenance.breakdown',           module: 'mfg_maintenance', titleKey: 'mfg_maintenance.notif.breakdown.title',      bodyKey: 'mfg_maintenance.notif.breakdown.body',      icon: 'tool',            severity: 'error',   actions: [], linkHref: '/backend/mfg-maintenance' },
]
export default notificationTypes
