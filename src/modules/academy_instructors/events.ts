import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'academy_instructors',
  events: [
    { id: 'academy_instructors.instructor.created', label: 'Instructor creado', entity: 'instructor', category: 'crud' },
    { id: 'academy_instructors.instructor.updated', label: 'Instructor actualizado', entity: 'instructor', category: 'crud' },
  ],
} as const)
