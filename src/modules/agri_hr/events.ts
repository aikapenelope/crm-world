import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_hr',
  events: [
    { id: 'agri_hr.payroll.approved',       label: 'Nómina de jornalero aprobada',       entity: 'payroll',     category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_hr.payroll.paid',           label: 'Nómina de jornalero pagada',          entity: 'payroll',     category: 'lifecycle' },
    { id: 'agri_hr.settlement.calculated',  label: 'Liquidación de productor calculada',  entity: 'settlement',  category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_hr.settlement.approved',    label: 'Liquidación de productor aprobada',   entity: 'settlement',  category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_hr.settlement.paid',        label: 'Liquidación de productor pagada',     entity: 'settlement',  category: 'lifecycle', clientBroadcast: true },
  ],
} as const)
