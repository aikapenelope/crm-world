import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'enrollment',
  events: [
    { id: 'enrollment.period.created', label: 'Período creado', entity: 'period', category: 'crud' },
    { id: 'enrollment.period.closed', label: 'Período cerrado', entity: 'period', category: 'lifecycle' },
    { id: 'enrollment.application.created', label: 'Solicitud creada', entity: 'application', category: 'crud' },
    { id: 'enrollment.application.approved', label: 'Solicitud aprobada', entity: 'application', category: 'lifecycle' },
    { id: 'enrollment.application.rejected', label: 'Solicitud rechazada', entity: 'application', category: 'lifecycle' },
    { id: 'enrollment.application.cancelled', label: 'Solicitud cancelada', entity: 'application', category: 'lifecycle' },
    { id: 'enrollment.document.uploaded', label: 'Documento subido', entity: 'document', category: 'crud' },
    { id: 'enrollment.document.approved', label: 'Documento aprobado', entity: 'document', category: 'lifecycle' },
    { id: 'enrollment.document.rejected', label: 'Documento rechazado', entity: 'document', category: 'lifecycle' },
  ],
} as const)
