import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'const_rfis',
  events: [
    { id: 'const_rfis.rfi.created', label: 'RFI creado', entity: 'rfi', category: 'crud' },
    { id: 'const_rfis.rfi.answered', label: 'RFI respondido', entity: 'rfi', category: 'lifecycle' },
    { id: 'const_rfis.rfi.overdue', label: 'RFI vencido sin respuesta', entity: 'rfi', category: 'lifecycle' },
    { id: 'const_rfis.submittal.approved', label: 'Submittal aprobado', entity: 'submittal', category: 'lifecycle' },
    { id: 'const_rfis.submittal.rejected', label: 'Submittal rechazado', entity: 'submittal', category: 'lifecycle' },
  ],
} as const)
