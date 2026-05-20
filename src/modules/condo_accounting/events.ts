import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'condo_accounting',
  events: [
    { id: 'condo_accounting.entry.created', label: 'Movimiento registrado', entity: 'entry', category: 'crud' },
    { id: 'condo_accounting.reserve.contribution', label: 'Aporte a fondo de reserva', entity: 'reserve', category: 'lifecycle' },
    { id: 'condo_accounting.budget.approved', label: 'Presupuesto aprobado', entity: 'budget', category: 'lifecycle' },
  ],
} as const)
