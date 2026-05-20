import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'const_daily',
  events: [
    { id: 'const_daily.report.created', label: 'Reporte diario creado', entity: 'report', category: 'crud' },
    { id: 'const_daily.report.submitted', label: 'Reporte diario enviado', entity: 'report', category: 'lifecycle' },
    { id: 'const_daily.incident.reported', label: 'Incidente de seguridad reportado', entity: 'report', category: 'lifecycle' },
  ],
} as const)
