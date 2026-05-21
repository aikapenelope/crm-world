import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'isp_billing',
  events: [
    { id: 'isp_billing.invoice.generated',       label: 'Factura mensual generada',      entity: 'invoice',  category: 'crud' },
    { id: 'isp_billing.invoice.paid',            label: 'Factura pagada',                entity: 'invoice',  category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_billing.invoice.partial_payment', label: 'Pago parcial registrado',        entity: 'invoice',  category: 'lifecycle' },
    { id: 'isp_billing.invoice.overdue',         label: 'Factura vencida',               entity: 'invoice',  category: 'lifecycle' },
    { id: 'isp_billing.cut_triggered',           label: 'Corte por mora activado',       entity: 'invoice',  category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_billing.reconnect_triggered',     label: 'Reactivación por pago',         entity: 'invoice',  category: 'lifecycle', clientBroadcast: true },
  ],
} as const)
