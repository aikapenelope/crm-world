import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_cold_chain',
  events: [
    { id: 'agri_cold_chain.temperature.reading',  label: 'Lectura de temperatura registrada', entity: 'temperature', category: 'crud',      excludeFromTriggers: true },
    { id: 'agri_cold_chain.temperature.excursion', label: 'Excursión de temperatura detectada', entity: 'temperature', category: 'alert',     clientBroadcast: true },
    { id: 'agri_cold_chain.lot.entered',           label: 'Lote ingresado a cuarto frío',      entity: 'storage_lot', category: 'lifecycle' },
    { id: 'agri_cold_chain.lot.exited',            label: 'Lote retirado del cuarto frío',     entity: 'storage_lot', category: 'lifecycle' },
    { id: 'agri_cold_chain.lot.nonconformity',     label: 'No-conformidad de temperatura en lote', entity: 'storage_lot', category: 'alert', clientBroadcast: true },
  ],
} as const)
