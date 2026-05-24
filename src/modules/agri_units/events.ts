import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_units',
  events: [
    // FarmUnit
    { id: 'agri_units.farm_unit.created',   label: 'Unidad productiva creada',     entity: 'farm_unit', category: 'crud' },
    { id: 'agri_units.farm_unit.updated',   label: 'Unidad productiva actualizada', entity: 'farm_unit', category: 'crud' },

    // Flock lifecycle
    { id: 'agri_units.flock.started',          label: 'Lote iniciado (pollitos entrados)',  entity: 'flock', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_units.flock.weekly_recorded',  label: 'Registro semanal completado',        entity: 'flock', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_units.flock.completed',        label: 'Lote finalizado/cosechado',          entity: 'flock', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_units.flock.terminated_early', label: 'Lote terminado anticipadamente',     entity: 'flock', category: 'lifecycle' },

    // Alertas (excludeFromTriggers: false — usuarios pueden crear workflows sobre ellas)
    { id: 'agri_units.flock.mortality_alert',  label: 'Mortalidad supera umbral diario',    entity: 'flock', category: 'custom',     clientBroadcast: true },
    { id: 'agri_units.flock.weight_below_target', label: 'Peso por debajo del objetivo',   entity: 'flock', category: 'custom',     clientBroadcast: true },
  ],
} as const)
