import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'const_projects',
  events: [
    { id: 'const_projects.project.created', label: 'Proyecto creado', entity: 'project', category: 'crud' },
    { id: 'const_projects.project.status_changed', label: 'Estado de proyecto cambiado', entity: 'project', category: 'lifecycle' },
    { id: 'const_projects.project.completed', label: 'Proyecto completado', entity: 'project', category: 'lifecycle' },
  ],
} as const)
