/**
 * Notification types for auto service orders.
 * These trigger in-app notifications and can be used to send WhatsApp messages.
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    id: 'auto_service_orders.vehicle_ready',
    title: 'Vehículo listo para retirar',
    description: 'Se envía cuando la orden pasa a status "ready"',
    category: 'automotive',
    defaultEnabled: true,
  },
  {
    id: 'auto_service_orders.estimate_sent',
    title: 'Presupuesto enviado',
    description: 'Se envía cuando se genera y envía un presupuesto al cliente',
    category: 'automotive',
    defaultEnabled: true,
  },
  {
    id: 'auto_service_orders.inspection_complete',
    title: 'Inspección completada',
    description: 'Se envía cuando el técnico completa la inspección digital',
    category: 'automotive',
    defaultEnabled: true,
  },
  {
    id: 'auto_service_orders.status_changed',
    title: 'Cambio de status',
    description: 'Se envía cuando la orden cambia de status',
    category: 'automotive',
    defaultEnabled: false,
  },
  {
    id: 'auto_service_orders.maintenance_due',
    title: 'Mantenimiento pendiente',
    description: 'Se envía cuando un vehículo necesita servicio (por tiempo o km)',
    category: 'automotive',
    defaultEnabled: true,
  },
]

export default notificationTypes
