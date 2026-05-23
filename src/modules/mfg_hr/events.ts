import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_hr',
  events: [
    { id: 'mfg_hr.bonus.approved', label: 'Bono de producción aprobado',    entity: 'bonus', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_hr.bonus.paid',     label: 'Bono de producción pagado',      entity: 'bonus', category: 'lifecycle' },
    { id: 'mfg_hr.shift.staffed',  label: 'Turno con personal confirmado',  entity: 'shift', category: 'crud' },
  ],
} as const)
