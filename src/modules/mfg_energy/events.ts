import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_energy',
  events: [
    { id: 'mfg_energy.outage.started',         label: 'Corte eléctrico iniciado (CORPOELEC)',        entity: 'outage', category: 'custom',     clientBroadcast: true },
    { id: 'mfg_energy.outage.ended',           label: 'Suministro eléctrico restablecido',           entity: 'outage', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_energy.generator.activated',    label: 'Generador activado por corte',                entity: 'outage', category: 'lifecycle' },
    { id: 'mfg_energy.consumption.high',       label: 'Consumo de energía anormalmente alto',        entity: 'energy', category: 'custom',     clientBroadcast: true },
  ],
} as const)
