import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'dist_routes',
  events: [
    { id: 'dist_routes.route.created', label: 'Ruta creada', entity: 'route', category: 'crud' },
    { id: 'dist_routes.route.updated', label: 'Ruta actualizada', entity: 'route', category: 'crud' },
    { id: 'dist_routes.visit.registered', label: 'Visita registrada', entity: 'visit', category: 'lifecycle' },
  ],
} as const)
