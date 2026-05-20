import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'condo_fees',
  events: [
    { id: 'condo_fees.config.created', label: 'Cuota configurada', entity: 'config', category: 'crud' },
    { id: 'condo_fees.receipts.generated', label: 'Recibos generados', entity: 'receipt', category: 'lifecycle' },
    { id: 'condo_fees.receipt.paid', label: 'Recibo pagado', entity: 'receipt', category: 'lifecycle' },
    { id: 'condo_fees.receipt.overdue', label: 'Recibo vencido', entity: 'receipt', category: 'lifecycle' },
  ],
} as const)
