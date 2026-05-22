import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    id: 'isp_support.ticket_assigned',
    label: 'Ticket asignado',
    description: 'Se te asignó un ticket de soporte técnico.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_support.ticket_resolved',
    label: 'Ticket resuelto',
    description: 'Un ticket de soporte fue marcado como resuelto.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_support.sla_breach',
    label: 'SLA incumplido',
    description: 'Un ticket superó su tiempo máximo de resolución (SLA).',
    category: 'alert',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_support.outage_detected',
    label: 'Avería masiva detectada',
    description: 'Se detectó una caída de nodo que afecta a múltiples abonados.',
    category: 'alert',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_support.outage_resolved',
    label: 'Avería masiva resuelta',
    description: 'La avería fue resuelta y el nodo está operativo.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
]
