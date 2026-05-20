import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'auto_inspections',
  events: [
    { id: 'auto_inspections.inspection.created', label: 'Inspección creada', entity: 'inspection', category: 'crud' },
    { id: 'auto_inspections.inspection.completed', label: 'Inspección completada', entity: 'inspection', category: 'lifecycle' },
    { id: 'auto_inspections.inspection.sent', label: 'Inspección enviada al cliente', entity: 'inspection', category: 'lifecycle' },
  ],
} as const)
