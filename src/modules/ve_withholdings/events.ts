import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 've_withholdings',
  events: [
    { id: 've_withholdings.record.created', label: 'Retención registrada', entity: 'record', category: 'crud' },
    { id: 've_withholdings.record.updated', label: 'Retención actualizada', entity: 'record', category: 'crud' },
    { id: 've_withholdings.record.declared', label: 'Retención declarada', entity: 'record', category: 'lifecycle' },
  ],
} as const)
