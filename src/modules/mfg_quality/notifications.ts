import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'mfg_quality.out_of_spec',
    module: 'mfg_quality',
    titleKey: 'mfg_quality.notif.out_of_spec.title',
    bodyKey: 'mfg_quality.notif.out_of_spec.body',
    icon: 'alert-triangle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/mfg-quality',
  },
  {
    type: 'mfg_quality.nc_created',
    module: 'mfg_quality',
    titleKey: 'mfg_quality.notif.nc_created.title',
    bodyKey: 'mfg_quality.notif.nc_created.body',
    icon: 'x-octagon',
    severity: 'error',
    actions: [],
    linkHref: '/backend/mfg-quality',
  },
  {
    type: 'mfg_quality.lot_rejected',
    module: 'mfg_quality',
    titleKey: 'mfg_quality.notif.lot_rejected.title',
    bodyKey: 'mfg_quality.notif.lot_rejected.body',
    icon: 'ban',
    severity: 'error',
    actions: [],
    linkHref: '/backend/mfg-quality',
  },
  {
    type: 'mfg_quality.out_of_control',
    module: 'mfg_quality',
    titleKey: 'mfg_quality.notif.out_of_control.title',
    bodyKey: 'mfg_quality.notif.out_of_control.body',
    icon: 'activity',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/mfg-quality',
  },
]
export default notificationTypes
