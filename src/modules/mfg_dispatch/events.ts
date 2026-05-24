import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_dispatch',
  events: [
    { id: 'mfg_dispatch.order.confirmed',  label: 'Pedido industrial confirmado — lotes reservados', entity: 'order',    category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_dispatch.dispatch.sent',    label: 'Guía de despacho emitida — en tránsito',          entity: 'dispatch', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_dispatch.dispatch.delivered', label: 'Entrega confirmada por el cliente',             entity: 'dispatch', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_dispatch.coa.released',     label: 'Certificado de análisis firmado y liberado',      entity: 'coa',      category: 'lifecycle' },
  ],
} as const)
