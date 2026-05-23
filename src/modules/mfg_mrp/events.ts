import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_mrp',
  events: [
    { id: 'mfg_mrp.run.completed',          label: 'Corrida MRP completada',                         entity: 'plan',        category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_mrp.requirement.at_risk',     label: 'Material en riesgo de ruptura de stock',         entity: 'requirement', category: 'alert',     clientBroadcast: true },
    { id: 'mfg_mrp.requisition.generated',   label: 'Requisición de compra generada automáticamente', entity: 'requisition', category: 'crud' },
    { id: 'mfg_mrp.po_date_overdue',         label: 'Fecha de OC vencida — importación en riesgo',    entity: 'requirement', category: 'alert',     clientBroadcast: true },
  ],
} as const)
