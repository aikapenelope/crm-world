import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'tuition',
  events: [
    { id: 'tuition.charge.created', label: 'Cargo creado', entity: 'charge', category: 'crud' },
    { id: 'tuition.charge.paid', label: 'Cargo pagado', entity: 'charge', category: 'lifecycle' },
    { id: 'tuition.charge.overdue', label: 'Cargo vencido', entity: 'charge', category: 'lifecycle' },
    { id: 'tuition.charge.waived', label: 'Cargo condonado', entity: 'charge', category: 'lifecycle' },
    { id: 'tuition.payment.recorded', label: 'Pago registrado', entity: 'payment', category: 'crud' },
    { id: 'tuition.discount.created', label: 'Descuento creado', entity: 'discount', category: 'crud' },
    { id: 'tuition.charges.generated', label: 'Cargos generados masivamente', entity: 'charge', category: 'lifecycle' },
  ],
} as const)
