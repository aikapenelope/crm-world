import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_reports',
  events: [
    { id: 'mfg_reports.kpi.generated', label: 'Resumen KPI generado', entity: 'report', category: 'crud' },
  ],
} as const)
