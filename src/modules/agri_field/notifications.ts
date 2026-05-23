import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_field.cycle_harvested',
    module: 'agri_field',
    titleKey: 'agri_field.notif.cycle_harvested.title',
    bodyKey: 'agri_field.notif.cycle_harvested.body',
    icon: 'wheat',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-field',
  },
  {
    type: 'agri_field.cycle_failed',
    module: 'agri_field',
    titleKey: 'agri_field.notif.cycle_failed.title',
    bodyKey: 'agri_field.notif.cycle_failed.body',
    icon: 'alert-triangle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-field',
  },
]
export default notificationTypes
