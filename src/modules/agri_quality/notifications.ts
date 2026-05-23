import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_quality.ccp_deviation',
    module: 'agri_quality',
    titleKey: 'agri_quality.notif.ccp_deviation.title',
    bodyKey: 'agri_quality.notif.ccp_deviation.body',
    icon: 'alert-octagon',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-quality/non-conformities',
  },
  {
    type: 'agri_quality.nc_created',
    module: 'agri_quality',
    titleKey: 'agri_quality.notif.nc_created.title',
    bodyKey: 'agri_quality.notif.nc_created.body',
    icon: 'file-warning',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-quality/non-conformities',
  },
  {
    type: 'agri_quality.nc_decision',
    module: 'agri_quality',
    titleKey: 'agri_quality.notif.nc_decision.title',
    bodyKey: 'agri_quality.notif.nc_decision.body',
    icon: 'check-square',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-quality/non-conformities',
  },
  {
    type: 'agri_quality.bpm_fail',
    module: 'agri_quality',
    titleKey: 'agri_quality.notif.bpm_fail.title',
    bodyKey: 'agri_quality.notif.bpm_fail.body',
    icon: 'clipboard-x',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-quality/bpm',
  },
]
export default notificationTypes
