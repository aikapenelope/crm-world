import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'condo_collections',
  events: [
    // clientBroadcast: debtors dashboard refreshes when morosos change
    { id: 'condo_collections.debtor.detected', label: 'Moroso detectado', entity: 'debtor', category: 'lifecycle', clientBroadcast: true },
    { id: 'condo_collections.agreement.created', label: 'Acuerdo de pago creado', entity: 'agreement', category: 'crud' },
    { id: 'condo_collections.agreement.defaulted', label: 'Acuerdo incumplido', entity: 'agreement', category: 'lifecycle', clientBroadcast: true },
    { id: 'condo_collections.action.logged', label: 'Gestión de cobro registrada', entity: 'action', category: 'crud' },
  ],
} as const)
