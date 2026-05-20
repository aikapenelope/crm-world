import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'const_schedule',
  events: [
    { id: 'const_schedule.task.started', label: 'Tarea iniciada', entity: 'task', category: 'lifecycle' },
    { id: 'const_schedule.task.completed', label: 'Tarea completada', entity: 'task', category: 'lifecycle' },
    { id: 'const_schedule.milestone.achieved', label: 'Hito alcanzado', entity: 'milestone', category: 'lifecycle' },
    { id: 'const_schedule.milestone.delayed', label: 'Hito retrasado', entity: 'milestone', category: 'lifecycle' },
  ],
} as const)
