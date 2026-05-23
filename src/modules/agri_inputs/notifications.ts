/**
 * agri_inputs — Notification type definitions
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_inputs.stock_low',
    module: 'agri_inputs',
    titleKey: 'agri_inputs.notif.stock_low.title',
    bodyKey: 'agri_inputs.notif.stock_low.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-inputs',
  },
  {
    type: 'agri_inputs.expiring_soon',
    module: 'agri_inputs',
    titleKey: 'agri_inputs.notif.expiring_soon.title',
    bodyKey: 'agri_inputs.notif.expiring_soon.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-inputs',
  },
  {
    type: 'agri_inputs.expired',
    module: 'agri_inputs',
    titleKey: 'agri_inputs.notif.expired.title',
    bodyKey: 'agri_inputs.notif.expired.body',
    icon: 'x-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-inputs',
  },
]

export default notificationTypes
