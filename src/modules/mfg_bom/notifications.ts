import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'mfg_bom.activated',
    module: 'mfg_bom',
    titleKey: 'mfg_bom.notif.activated.title',
    bodyKey: 'mfg_bom.notif.activated.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/mfg-bom',
  },
  {
    type: 'mfg_bom.approval_required',
    module: 'mfg_bom',
    titleKey: 'mfg_bom.notif.approval_required.title',
    bodyKey: 'mfg_bom.notif.approval_required.body',
    icon: 'clipboard-check',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/mfg-bom',
  },
]
export default notificationTypes
