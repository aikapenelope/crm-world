import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'mfg_orders.order_released',
    module: 'mfg_orders',
    titleKey: 'mfg_orders.notif.released.title',
    bodyKey: 'mfg_orders.notif.released.body',
    icon: 'play-circle',
    severity: 'info',
    actions: [],
    linkHref: '/backend/mfg-orders',
  },
  {
    type: 'mfg_orders.order_completed',
    module: 'mfg_orders',
    titleKey: 'mfg_orders.notif.completed.title',
    bodyKey: 'mfg_orders.notif.completed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/mfg-orders',
  },
  {
    type: 'mfg_orders.downtime_started',
    module: 'mfg_orders',
    titleKey: 'mfg_orders.notif.downtime.title',
    bodyKey: 'mfg_orders.notif.downtime.body',
    icon: 'alert-octagon',
    severity: 'error',
    actions: [],
    linkHref: '/backend/mfg-orders',
  },
  {
    type: 'mfg_orders.electrical_cut',
    module: 'mfg_orders',
    titleKey: 'mfg_orders.notif.electrical.title',
    bodyKey: 'mfg_orders.notif.electrical.body',
    icon: 'zap-off',
    severity: 'error',
    actions: [],
    linkHref: '/backend/mfg-orders',
  },
]
export default notificationTypes
