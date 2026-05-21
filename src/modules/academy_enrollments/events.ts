import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'academy_enrollments',
  events: [
    { id: 'academy_enrollments.enrollment.created', label: 'Inscripción creada', entity: 'enrollment', category: 'crud', clientBroadcast: true },
    { id: 'academy_enrollments.enrollment.activated', label: 'Inscripción activada', entity: 'enrollment', category: 'lifecycle', clientBroadcast: true },
    { id: 'academy_enrollments.enrollment.completed', label: 'Inscripción completada', entity: 'enrollment', category: 'lifecycle', clientBroadcast: true },
    { id: 'academy_enrollments.enrollment.withdrawn', label: 'Alumno retirado', entity: 'enrollment', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)
