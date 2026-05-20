import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'const_progress',
  events: [
    { id: 'const_progress.valuation.submitted', label: 'Valuación enviada para aprobación', entity: 'valuation', category: 'lifecycle' },
    { id: 'const_progress.valuation.approved', label: 'Valuación aprobada', entity: 'valuation', category: 'lifecycle' },
    { id: 'const_progress.valuation.paid', label: 'Valuación pagada', entity: 'valuation', category: 'lifecycle' },
    { id: 'const_progress.valuation.rejected', label: 'Valuación rechazada', entity: 'valuation', category: 'lifecycle' },
  ],
} as const)
