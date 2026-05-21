import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'isp_subscribers',
  events: [
    { id: 'isp_subscribers.subscriber.created',          label: 'Abonado registrado',               entity: 'subscriber', category: 'crud' },
    { id: 'isp_subscribers.subscriber.activated',        label: 'Servicio activado',                entity: 'subscriber', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_subscribers.subscriber.suspended_overdue',label: 'Suspendido por mora',              entity: 'subscriber', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_subscribers.subscriber.reconnected',      label: 'Reconectado tras pago',            entity: 'subscriber', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_subscribers.subscriber.cancelled',        label: 'Servicio cancelado',               entity: 'subscriber', category: 'lifecycle' },
    { id: 'isp_subscribers.subscriber.plan_changed',     label: 'Plan de servicio modificado',      entity: 'subscriber', category: 'lifecycle' },
    { id: 'isp_subscribers.overdue.detected',            label: 'Abonado alcanzó días de gracia',   entity: 'subscriber', category: 'lifecycle', excludeFromTriggers: true },
  ],
} as const)
