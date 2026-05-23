import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_processing',
  events: [
    { id: 'agri_processing.batch.created',            label: 'Lote de beneficio creado',           entity: 'batch', category: 'crud',      clientBroadcast: true },
    { id: 'agri_processing.batch.pending_qc',         label: 'Lote pendiente de aprobación QC',    entity: 'batch', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_processing.batch.approved',           label: 'Lote aprobado para despacho',        entity: 'batch', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_processing.batch.dispatched',         label: 'Lote despachado',                    entity: 'batch', category: 'lifecycle' },
    { id: 'agri_processing.withdrawal_block',         label: 'Despacho bloqueado por retiro activo', entity: 'batch', category: 'alert',   clientBroadcast: true },
    { id: 'agri_processing.lot.created',              label: 'Lote de producto terminado creado',  entity: 'lot',   category: 'crud' },
  ],
} as const)
