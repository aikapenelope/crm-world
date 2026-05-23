import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_traceability.recall_initiated',
    module: 'agri_traceability',
    titleKey: 'agri_traceability.notif.recall_initiated.title',
    bodyKey: 'agri_traceability.notif.recall_initiated.body',
    icon: 'alert-triangle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-traceability',
  },
  {
    type: 'agri_traceability.recall_approved',
    module: 'agri_traceability',
    titleKey: 'agri_traceability.notif.recall_approved.title',
    bodyKey: 'agri_traceability.notif.recall_approved.body',
    icon: 'check-circle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-traceability',
  },
]
export default notificationTypes
