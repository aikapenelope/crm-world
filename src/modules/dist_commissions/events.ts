import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'dist_commissions',
  events: [
    { id: 'dist_commissions.rule.created', label: 'Regla de comisión creada', entity: 'rule', category: 'crud' },
    { id: 'dist_commissions.record.created', label: 'Comisión generada', entity: 'record', category: 'lifecycle' },
    { id: 'dist_commissions.record.approved', label: 'Comisión aprobada', entity: 'record', category: 'lifecycle' },
  ],
} as const)
