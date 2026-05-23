import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_procurement',
  events: [
    { id: 'mfg_procurement.po.sent',       label: 'OC enviada al proveedor',                         entity: 'po', category: 'lifecycle' },
    { id: 'mfg_procurement.po.at_customs', label: 'Mercancía llegó al puerto — en proceso de aduana', entity: 'po', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_procurement.po.delivered',  label: 'Mercancía recibida en almacén',                    entity: 'po', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_procurement.import.delay',  label: 'Retraso en importación — riesgo de ruptura',       entity: 'po', category: 'alert',     clientBroadcast: true },
  ],
} as const)
