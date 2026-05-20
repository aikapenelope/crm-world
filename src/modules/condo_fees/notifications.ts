import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    id: 'condo_fees.receipt_overdue',
    label: 'Recibo vencido',
    description: 'Se notifica cuando un recibo de condominio pasa a estado vencido.',
    category: 'alert',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_fees.receipt_paid',
    label: 'Pago recibido',
    description: 'Se notifica cuando se registra un pago de condominio.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_fees.receipts_generated',
    label: 'Recibos generados',
    description: 'Se notifica cuando se generan los recibos del mes para un edificio.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'condo_fees.payment_reminder',
    label: 'Recordatorio de pago',
    description: 'Recordatorio automático 3 días antes del vencimiento.',
    category: 'reminder',
    defaultChannels: ['in_app'],
  },
]
