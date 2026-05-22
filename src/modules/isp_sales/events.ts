import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'isp_sales',
  events: [
    { id: 'isp_sales.lead.created',        label: 'Nuevo lead registrado',      entity: 'lead', category: 'crud' },
    { id: 'isp_sales.lead.coverage_checked', label: 'Cobertura verificada',     entity: 'lead', category: 'lifecycle' },
    { id: 'isp_sales.lead.converted',      label: 'Lead convertido a abonado',  entity: 'lead', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_sales.lead.lost',           label: 'Lead perdido',               entity: 'lead', category: 'lifecycle' },
    { id: 'isp_sales.commission.generated', label: 'Comisión generada',         entity: 'commission', category: 'lifecycle' },
  ],
} as const)
