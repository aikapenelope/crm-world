import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_cold_chain.temperature_excursion',
    module: 'agri_cold_chain',
    titleKey: 'agri_cold_chain.notif.excursion.title',
    bodyKey: 'agri_cold_chain.notif.excursion.body',
    icon: 'thermometer',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-cold-chain',
  },
  {
    type: 'agri_cold_chain.lot_nonconformity',
    module: 'agri_cold_chain',
    titleKey: 'agri_cold_chain.notif.lot_nonconformity.title',
    bodyKey: 'agri_cold_chain.notif.lot_nonconformity.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-cold-chain',
  },
]
export default notificationTypes
