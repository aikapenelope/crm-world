import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  { id: 'const_progress.valuation_approved', label: 'Valuación aprobada', description: 'Una valuación fue aprobada para pago.', category: 'info', defaultChannels: ['in_app'] },
  { id: 'const_progress.valuation_submitted', label: 'Valuación enviada', description: 'Una valuación fue enviada para revisión.', category: 'info', defaultChannels: ['in_app'] },
]
