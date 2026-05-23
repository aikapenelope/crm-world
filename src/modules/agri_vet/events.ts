import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_vet',
  events: [
    // Vacunación
    { id: 'agri_vet.vaccination.applied',       label: 'Vacunación aplicada al lote',       entity: 'vaccination',  category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_vet.vaccination.missed',         label: 'Vacunación no aplicada (vencida)',  entity: 'vaccination',  category: 'alert',     clientBroadcast: true },

    // Medicación — crítico para retiro
    { id: 'agri_vet.medication.prescribed',      label: 'Tratamiento prescrito al lote',     entity: 'medication',   category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_vet.medication.resolved',        label: 'Tratamiento cerrado como resuelto', entity: 'medication',   category: 'lifecycle' },
    { id: 'agri_vet.withdrawal_period.active',   label: 'Período de retiro activo en lote',  entity: 'medication',   category: 'alert',     clientBroadcast: true },

    // Mortalidad
    { id: 'agri_vet.mortality.recorded',         label: 'Mortalidad diaria registrada',      entity: 'mortality',    category: 'crud',      excludeFromTriggers: true },
    { id: 'agri_vet.mortality.alert_triggered',  label: 'Alerta de mortalidad anormal',      entity: 'mortality',    category: 'alert',     clientBroadcast: true },
  ],
} as const)
