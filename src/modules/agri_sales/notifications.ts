import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_sales.order_confirmed',
    module: 'agri_sales',
    titleKey: 'agri_sales.notif.order_confirmed.title',
    bodyKey: 'agri_sales.notif.order_confirmed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-sales',
  },
  {
    type: 'agri_sales.dispatch_temp_incident',
    module: 'agri_sales',
    titleKey: 'agri_sales.notif.dispatch_temp_incident.title',
    bodyKey: 'agri_sales.notif.dispatch_temp_incident.body',
    icon: 'thermometer',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-sales/dispatches',
  },
  {
    type: 'agri_sales.invoice_paid',
    module: 'agri_sales',
    titleKey: 'agri_sales.notif.invoice_paid.title',
    bodyKey: 'agri_sales.notif.invoice_paid.body',
    icon: 'dollar-sign',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-sales/invoices',
  },
  {
    type: 'agri_sales.invoice_overdue',
    module: 'agri_sales',
    titleKey: 'agri_sales.notif.invoice_overdue.title',
    bodyKey: 'agri_sales.notif.invoice_overdue.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-sales/invoices',
  },
]
export default notificationTypes
