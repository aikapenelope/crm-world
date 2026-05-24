import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_inputs',
  events: [
    { id: 'agri_inputs.item.created',        label: 'Insumo registrado en inventario',    entity: 'item',     category: 'crud' },
    { id: 'agri_inputs.item.stock_low',      label: 'Stock por debajo del mínimo',        entity: 'item',     category: 'custom', clientBroadcast: true },
    { id: 'agri_inputs.item.expiring_soon',  label: 'Insumo próximo a vencer (≤ 30 días)', entity: 'item',    category: 'custom', clientBroadcast: true },
    { id: 'agri_inputs.item.expired',        label: 'Insumo vencido',                     entity: 'item',     category: 'custom', clientBroadcast: true },
    { id: 'agri_inputs.movement.recorded',   label: 'Movimiento de inventario registrado', entity: 'movement', category: 'crud', excludeFromTriggers: true },
  ],
} as const)
