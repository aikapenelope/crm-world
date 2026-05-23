import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_dispatch.order_confirmed', module: 'mfg_dispatch', titleKey: 'mfg_dispatch.notif.confirmed.title', bodyKey: 'mfg_dispatch.notif.confirmed.body', icon: 'check-circle',  severity: 'success', actions: [], linkHref: '/backend/mfg-dispatch' },
  { type: 'mfg_dispatch.delivered',       module: 'mfg_dispatch', titleKey: 'mfg_dispatch.notif.delivered.title', bodyKey: 'mfg_dispatch.notif.delivered.body', icon: 'package-check', severity: 'success', actions: [], linkHref: '/backend/mfg-dispatch' },
]
export default notificationTypes
