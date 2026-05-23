import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_hr.settlement_calculated',
    module: 'agri_hr',
    titleKey: 'agri_hr.notif.settlement_calculated.title',
    bodyKey: 'agri_hr.notif.settlement_calculated.body',
    icon: 'calculator',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-hr/settlements',
  },
  {
    type: 'agri_hr.settlement_approved',
    module: 'agri_hr',
    titleKey: 'agri_hr.notif.settlement_approved.title',
    bodyKey: 'agri_hr.notif.settlement_approved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-hr/settlements',
  },
  {
    type: 'agri_hr.settlement_paid',
    module: 'agri_hr',
    titleKey: 'agri_hr.notif.settlement_paid.title',
    bodyKey: 'agri_hr.notif.settlement_paid.body',
    icon: 'dollar-sign',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-hr/settlements',
  },
]
export default notificationTypes
