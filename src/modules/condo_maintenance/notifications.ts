import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    id: 'condo_maintenance.request_created',
    label: 'Nueva solicitud de mantenimiento',
    description: 'Se notifica cuando un propietario crea una solicitud de mantenimiento.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_maintenance.request_assigned',
    label: 'Solicitud asignada',
    description: 'Se notifica cuando una solicitud es asignada a un proveedor.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_maintenance.request_completed',
    label: 'Solicitud completada',
    description: 'Se notifica cuando una solicitud de mantenimiento es completada.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_maintenance.emergency',
    label: 'Emergencia de mantenimiento',
    description: 'Se notifica cuando se reporta una emergencia (prioridad máxima).',
    category: 'alert',
    defaultChannels: ['in_app'],
  },
]
