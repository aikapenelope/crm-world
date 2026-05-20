import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'grades',
  events: [
    { id: 'grades.grade.recorded', label: 'Nota registrada', entity: 'grade', category: 'crud' },
    { id: 'grades.grade.updated', label: 'Nota actualizada', entity: 'grade', category: 'crud' },
    { id: 'grades.report_card.generated', label: 'Boletín generado', entity: 'report_card', category: 'lifecycle' },
    { id: 'grades.report_card.published', label: 'Boletín publicado', entity: 'report_card', category: 'lifecycle' },
  ],
} as const)
