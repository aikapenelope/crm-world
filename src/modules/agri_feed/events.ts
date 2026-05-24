import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_feed',
  events: [
    { id: 'agri_feed.formula.created',      label: 'Fórmula de alimento creada',       entity: 'formula',   category: 'crud' },
    { id: 'agri_feed.formula.cost_updated', label: 'Costo de fórmula recalculado',      entity: 'formula',   category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_feed.batch.produced',       label: 'Lote de alimento registrado',       entity: 'batch',     category: 'crud', clientBroadcast: true },
    { id: 'agri_feed.batch.approved',       label: 'Lote de alimento aprobado',         entity: 'batch',     category: 'lifecycle' },
    { id: 'agri_feed.batch.rejected',       label: 'Lote de alimento rechazado',        entity: 'batch',     category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_feed.stock.low_alert',      label: 'Stock de alimento bajo',            entity: 'batch',     category: 'custom',     clientBroadcast: true },
    { id: 'agri_feed.allocation.recorded',  label: 'Alimento asignado a lote de aves',  entity: 'allocation', category: 'crud', excludeFromTriggers: true },
  ],
} as const)
