import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_quality',
  events: [
    { id: 'mfg_quality.inspection.out_of_spec',    label: 'Inspección fuera de especificación',           entity: 'inspection',    category: 'custom',     clientBroadcast: true },
    { id: 'mfg_quality.inspection.out_of_control', label: 'Proceso fuera de control estadístico (SPC)',   entity: 'inspection',    category: 'custom',     clientBroadcast: true },
    { id: 'mfg_quality.nc.created',                label: 'No-Conformidad abierta',                       entity: 'nc',            category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_quality.nc.disposition_set',        label: 'Disposición definida para No-Conformidad',     entity: 'nc',            category: 'lifecycle' },
    { id: 'mfg_quality.nc.closed',                 label: 'No-Conformidad cerrada',                       entity: 'nc',            category: 'lifecycle' },
    { id: 'mfg_quality.lot.released',              label: 'Lote liberado por control de calidad',         entity: 'lot',           category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_quality.lot.rejected',              label: 'Lote rechazado por control de calidad',        entity: 'lot',           category: 'custom',     clientBroadcast: true },
  ],
} as const)
