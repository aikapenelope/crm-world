import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_inventory',
  events: [
    { id: 'mfg_inventory.lot.received',           label: 'Lote recibido en almacén',              entity: 'lot',   category: 'crud' },
    { id: 'mfg_inventory.lot.released_from_qc',   label: 'Lote liberado de cuarentena QC',        entity: 'lot',   category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_inventory.lot.rejected_by_qc',     label: 'Lote rechazado por QC',                 entity: 'lot',   category: 'custom',     clientBroadcast: true },
    { id: 'mfg_inventory.stock.below_reorder',    label: 'Stock por debajo del punto de reorden', entity: 'stock', category: 'custom',     clientBroadcast: true },
    { id: 'mfg_inventory.lot.expiring_soon',      label: 'Lote próximo a vencer (≤ 30 días)',     entity: 'lot',   category: 'custom',     clientBroadcast: true },
    { id: 'mfg_inventory.lot.expired',            label: 'Lote vencido — requiere disposición',   entity: 'lot',   category: 'custom',     clientBroadcast: true },
    { id: 'mfg_inventory.movement.gi_production', label: 'Materia prima enviada a producción',    entity: 'movement', category: 'crud',  excludeFromTriggers: true },
  ],
} as const)
