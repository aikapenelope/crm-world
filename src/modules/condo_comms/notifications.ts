import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    id: 'condo_comms.circular_published',
    label: 'Nueva circular publicada',
    description: 'Se notifica cuando se publica una circular para el edificio.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_comms.vote_opened',
    label: 'Votación abierta',
    description: 'Se notifica cuando se abre una nueva votación.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_comms.vote_closing_soon',
    label: 'Votación por cerrar',
    description: 'Se notifica 24 horas antes de que cierre una votación.',
    category: 'reminder',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_comms.assembly_scheduled',
    label: 'Asamblea programada',
    description: 'Se notifica cuando se programa una asamblea.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
]
