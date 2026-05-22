import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    id: 'isp_subscribers.service_activated',
    label: 'Servicio activado',
    description: 'La instalación fue completada y el servicio del abonado está activo.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_subscribers.service_suspended',
    label: 'Servicio suspendido',
    description: 'El servicio de un abonado fue suspendido (por mora o voluntariamente).',
    category: 'alert',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_subscribers.service_reconnected',
    label: 'Servicio reactivado',
    description: 'El servicio de un abonado fue reactivado.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
]
