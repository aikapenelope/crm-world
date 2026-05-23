import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_subcontract',
  events: [
    { id: 'mfg_subcontract.order.materials_sent', label: 'Materiales enviados al maquilador',  entity: 'order', category: 'lifecycle' },
    { id: 'mfg_subcontract.order.completed',      label: 'Maquila completada — PT recibido',    entity: 'order', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_subcontract.scrap.exceeded',       label: 'Merma del maquilador supera estándar', entity: 'order', category: 'alert',     clientBroadcast: true },
  ],
} as const)
