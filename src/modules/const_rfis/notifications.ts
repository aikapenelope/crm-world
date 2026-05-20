import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  { id: 'const_rfis.rfi_overdue', label: 'RFI vencido', description: 'RFI sin respuesta pasó su fecha límite.', category: 'alert', defaultChannels: ['in_app'] },
  { id: 'const_rfis.rfi_answered', label: 'RFI respondido', description: 'Un RFI recibió respuesta.', category: 'info', defaultChannels: ['in_app'] },
  { id: 'const_rfis.submittal_approved', label: 'Submittal aprobado', description: 'Submittal fue aprobado por el proyectista.', category: 'info', defaultChannels: ['in_app'] },
]
