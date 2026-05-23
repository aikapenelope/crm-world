import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_floor',
  events: [
    { id: 'mfg_floor.shift.closed',          label: 'Turno cerrado y reporte generado',           entity: 'shift',   category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_floor.oee.below_threshold',   label: 'OEE por debajo del umbral aceptable',        entity: 'oee',     category: 'alert',     clientBroadcast: true },
    { id: 'mfg_floor.shift.whatsapp_sent',   label: 'Reporte de turno enviado por WhatsApp',      entity: 'shift',   category: 'crud' },
  ],
} as const)
