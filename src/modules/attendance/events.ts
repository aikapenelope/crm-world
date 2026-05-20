import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'attendance',
  events: [
    { id: 'attendance.record.created', label: 'Asistencia registrada', entity: 'record', category: 'crud' },
    { id: 'attendance.record.updated', label: 'Asistencia actualizada', entity: 'record', category: 'crud' },
    { id: 'attendance.bulk.recorded', label: 'Asistencia masiva registrada', entity: 'record', category: 'lifecycle' },
    { id: 'attendance.summary.updated', label: 'Resumen actualizado', entity: 'summary', category: 'lifecycle' },
  ],
} as const)
