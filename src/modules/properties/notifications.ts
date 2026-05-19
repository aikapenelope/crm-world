import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'properties.lead.inactive',
    module: 'properties',
    titleKey: 'properties.notifications.lead.inactive.title',
    bodyKey: 'properties.notifications.lead.inactive.body',
    icon: 'user-x',
    severity: 'warning',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/customers/people/{sourceEntityId}',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/customers/people/{sourceEntityId}',
    expiresAfterHours: 168, // 7 days
  },
  {
    type: 'properties.property.no_activity',
    module: 'properties',
    titleKey: 'properties.notifications.property.no_activity.title',
    bodyKey: 'properties.notifications.property.no_activity.body',
    icon: 'building-2',
    severity: 'warning',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/properties/{sourceEntityId}',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/properties/{sourceEntityId}',
    expiresAfterHours: 168, // 7 days
  },
  {
    type: 'properties.property.reserved',
    module: 'properties',
    titleKey: 'properties.notifications.property.reserved.title',
    bodyKey: 'properties.notifications.property.reserved.body',
    icon: 'bookmark',
    severity: 'info',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/properties/{sourceEntityId}',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/properties/{sourceEntityId}',
    expiresAfterHours: 72, // 3 days
  },
  {
    type: 'transactions.closing.completed',
    module: 'transactions',
    titleKey: 'transactions.notifications.closing.completed.title',
    bodyKey: 'transactions.notifications.closing.completed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/transactions',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/transactions',
    expiresAfterHours: 168, // 7 days
  },
]

export default notificationTypes
