import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_floor.shift_closed',     module: 'mfg_floor', titleKey: 'mfg_floor.notif.shift_closed.title',    bodyKey: 'mfg_floor.notif.shift_closed.body',    icon: 'clock',           severity: 'info',    actions: [], linkHref: '/backend/mfg-floor' },
  { type: 'mfg_floor.oee_below',        module: 'mfg_floor', titleKey: 'mfg_floor.notif.oee_below.title',       bodyKey: 'mfg_floor.notif.oee_below.body',       icon: 'trending-down',   severity: 'warning', actions: [], linkHref: '/backend/mfg-floor' },
]
export default notificationTypes
