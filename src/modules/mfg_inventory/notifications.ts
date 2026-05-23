import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'mfg_inventory.lot_in_quarantine',
    module: 'mfg_inventory',
    titleKey: 'mfg_inventory.notif.lot_quarantine.title',
    bodyKey: 'mfg_inventory.notif.lot_quarantine.body',
    icon: 'clock',
    severity: 'info',
    actions: [],
    linkHref: '/backend/mfg-inventory',
  },
  {
    type: 'mfg_inventory.lot_rejected',
    module: 'mfg_inventory',
    titleKey: 'mfg_inventory.notif.lot_rejected.title',
    bodyKey: 'mfg_inventory.notif.lot_rejected.body',
    icon: 'x-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/mfg-inventory',
  },
  {
    type: 'mfg_inventory.stock_below_reorder',
    module: 'mfg_inventory',
    titleKey: 'mfg_inventory.notif.stock_reorder.title',
    bodyKey: 'mfg_inventory.notif.stock_reorder.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/mfg-inventory',
  },
  {
    type: 'mfg_inventory.lot_expiring',
    module: 'mfg_inventory',
    titleKey: 'mfg_inventory.notif.lot_expiring.title',
    bodyKey: 'mfg_inventory.notif.lot_expiring.body',
    icon: 'calendar',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/mfg-inventory',
  },
]
export default notificationTypes
