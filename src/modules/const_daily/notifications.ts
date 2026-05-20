import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications'

export const notificationTypes: NotificationTypeDefinition[] = [
  { id: 'const_daily.incident_reported', label: 'Incidente de seguridad reportado', description: 'Se reportó un incidente en el reporte diario.', category: 'alert', defaultChannels: ['in_app'] },
  { id: 'const_daily.report_approved', label: 'RDO aprobado', description: 'El reporte diario de obra fue aprobado.', category: 'info', defaultChannels: ['in_app'] },
]
