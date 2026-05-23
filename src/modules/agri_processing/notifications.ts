import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_processing.batch_pending_qc',
    module: 'agri_processing',
    titleKey: 'agri_processing.notif.batch_pending_qc.title',
    bodyKey: 'agri_processing.notif.batch_pending_qc.body',
    icon: 'clipboard-check',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-processing',
  },
  {
    type: 'agri_processing.batch_approved',
    module: 'agri_processing',
    titleKey: 'agri_processing.notif.batch_approved.title',
    bodyKey: 'agri_processing.notif.batch_approved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-processing',
  },
  {
    type: 'agri_processing.withdrawal_block',
    module: 'agri_processing',
    titleKey: 'agri_processing.notif.withdrawal_block.title',
    bodyKey: 'agri_processing.notif.withdrawal_block.body',
    icon: 'shield-x',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-vet/medications',
  },
]
export default notificationTypes
