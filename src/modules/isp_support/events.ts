import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'isp_support',
  events: [
    { id: 'isp_support.ticket.created',              label: 'Ticket creado',           entity: 'ticket',  category: 'crud' },
    { id: 'isp_support.ticket.assigned',             label: 'Técnico asignado',        entity: 'ticket',  category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_support.ticket.resolved',             label: 'Ticket resuelto',         entity: 'ticket',  category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_support.ticket.sla_breached',         label: 'SLA incumplido',          entity: 'ticket',  category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_support.outage.created',              label: 'Avería masiva creada',    entity: 'outage',  category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_support.outage.resolved',             label: 'Avería masiva resuelta',  entity: 'outage',  category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_support.outage.subscribers_notified', label: 'Abonados notificados',    entity: 'outage',  category: 'lifecycle' },
  ],
} as const)
