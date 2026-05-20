import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'students',
  events: [
    { id: 'students.student.created', label: 'Estudiante registrado', entity: 'student', category: 'crud' },
    { id: 'students.student.updated', label: 'Estudiante actualizado', entity: 'student', category: 'crud' },
    { id: 'students.student.graduated', label: 'Estudiante graduado', entity: 'student', category: 'lifecycle' },
    { id: 'students.student.withdrawn', label: 'Estudiante retirado', entity: 'student', category: 'lifecycle' },
    { id: 'students.student.transferred', label: 'Estudiante transferido', entity: 'student', category: 'lifecycle' },
    { id: 'students.student.deleted', label: 'Estudiante eliminado', entity: 'student', category: 'crud' },
    { id: 'students.representative.linked', label: 'Representante vinculado', entity: 'representative', category: 'crud' },
    { id: 'students.representative.unlinked', label: 'Representante desvinculado', entity: 'representative', category: 'crud' },
  ],
} as const)
