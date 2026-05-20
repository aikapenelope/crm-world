import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'auto_estimates',
  events: [
    { id: 'auto_estimates.estimate.created', label: 'Presupuesto creado', entity: 'estimate', category: 'crud' },
    { id: 'auto_estimates.estimate.sent', label: 'Presupuesto enviado', entity: 'estimate', category: 'lifecycle' },
    { id: 'auto_estimates.estimate.approved', label: 'Presupuesto aprobado', entity: 'estimate', category: 'lifecycle' },
  ],
} as const)
