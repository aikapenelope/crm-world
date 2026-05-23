import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_traceability',
  events: [
    { id: 'agri_traceability.recall.initiated',  label: 'Recall iniciado',                         entity: 'recall', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_traceability.recall.approved',   label: 'Recall aprobado por GM',                 entity: 'recall', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_traceability.recall.completed',  label: 'Recall completado',                       entity: 'recall', category: 'lifecycle' },
    { id: 'agri_traceability.trace.queried',     label: 'Consulta de trazabilidad realizada',      entity: 'trace',  category: 'audit',     excludeFromTriggers: true },
  ],
} as const)
