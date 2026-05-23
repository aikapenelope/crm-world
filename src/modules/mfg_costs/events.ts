import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_costs',
  events: [
    { id: 'mfg_costs.variance.calculated',  label: 'Variaciones de costo calculadas al cierre',  entity: 'variance', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_costs.variance.unfavorable', label: 'Variación desfavorable supera umbral',         entity: 'variance', category: 'alert',     clientBroadcast: true },
  ],
} as const)
