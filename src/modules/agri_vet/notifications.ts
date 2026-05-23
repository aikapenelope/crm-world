/**
 * agri_vet — Notification type definitions
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_vet.vaccination_applied',
    module: 'agri_vet',
    titleKey: 'agri_vet.notif.vaccination_applied.title',
    bodyKey: 'agri_vet.notif.vaccination_applied.body',
    icon: 'syringe',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-vet/vaccinations',
  },
  {
    type: 'agri_vet.vaccination_missed',
    module: 'agri_vet',
    titleKey: 'agri_vet.notif.vaccination_missed.title',
    bodyKey: 'agri_vet.notif.vaccination_missed.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-vet/vaccinations',
  },
  {
    type: 'agri_vet.medication_prescribed',
    module: 'agri_vet',
    titleKey: 'agri_vet.notif.medication_prescribed.title',
    bodyKey: 'agri_vet.notif.medication_prescribed.body',
    icon: 'pill',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-vet/medications',
  },
  {
    type: 'agri_vet.withdrawal_period_active',
    module: 'agri_vet',
    titleKey: 'agri_vet.notif.withdrawal_period_active.title',
    bodyKey: 'agri_vet.notif.withdrawal_period_active.body',
    icon: 'shield-alert',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-vet/medications',
  },
  {
    type: 'agri_vet.mortality_alert',
    module: 'agri_vet',
    titleKey: 'agri_vet.notif.mortality_alert.title',
    bodyKey: 'agri_vet.notif.mortality_alert.body',
    icon: 'alert-octagon',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-vet/mortality',
  },
]

export default notificationTypes
