import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'tuition.charge.overdue',
    module: 'tuition',
    titleKey: 'tuition.notifications.charge.overdue.title',
    bodyKey: 'tuition.notifications.charge.overdue.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/tuition/debtors',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/tuition/debtors',
    expiresAfterHours: 168,
  },
  {
    type: 'tuition.payment.received',
    module: 'tuition',
    titleKey: 'tuition.notifications.payment.received.title',
    bodyKey: 'tuition.notifications.payment.received.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/tuition/payments',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/tuition/payments',
    expiresAfterHours: 72,
  },
]

export default notificationTypes
