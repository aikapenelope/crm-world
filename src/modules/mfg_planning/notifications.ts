import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_planning.capacity_overloaded', module: 'mfg_planning', titleKey: 'mfg_planning.notif.overloaded.title', bodyKey: 'mfg_planning.notif.overloaded.body', icon: 'alert-triangle', severity: 'warning', actions: [], linkHref: '/backend/mfg-planning' },
]
export default notificationTypes
