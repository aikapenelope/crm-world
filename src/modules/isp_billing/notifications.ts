import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    id: 'isp_billing.invoice_generated',
    label: 'Facturas generadas',
    description: 'El sistema generó las facturas del mes para los abonados.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_billing.payment_received',
    label: 'Pago registrado',
    description: 'Se registró un pago de un abonado.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_billing.invoice_overdue',
    label: 'Factura vencida — pre-corte',
    description: 'Un abonado está próximo al corte por mora (3 o 1 día antes).',
    category: 'alert',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_billing.service_cut',
    label: 'Servicio suspendido por mora',
    description: 'Un abonado fue suspendido automáticamente por falta de pago.',
    category: 'alert',
    defaultChannels: ['in_app'],
  },
  {
    id: 'isp_billing.service_reconnected',
    label: 'Servicio reactivado',
    description: 'Un abonado pagó y su servicio fue reactivado.',
    category: 'info',
    defaultChannels: ['in_app'],
  },
]
