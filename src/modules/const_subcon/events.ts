import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'const_subcon',
  events: [
    { id: 'const_subcon.contract.created', label: 'Contrato de subcontrato creado', entity: 'contract', category: 'crud' },
    { id: 'const_subcon.payment.approved', label: 'Pago a subcontratista aprobado', entity: 'payment', category: 'lifecycle' },
  ],
} as const)
