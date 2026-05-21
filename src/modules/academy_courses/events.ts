import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'academy_courses',
  events: [
    { id: 'academy_courses.course.created', label: 'Curso creado', entity: 'course', category: 'crud' },
    { id: 'academy_courses.course.updated', label: 'Curso actualizado', entity: 'course', category: 'crud' },
    { id: 'academy_courses.course.archived', label: 'Curso archivado', entity: 'course', category: 'lifecycle' },
  ],
} as const)
