import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'school_comms',
  events: [
    { id: 'school_comms.announcement.created', label: 'Comunicación creada', entity: 'announcement', category: 'crud' },
    { id: 'school_comms.announcement.published', label: 'Comunicación publicada', entity: 'announcement', category: 'lifecycle' },
    { id: 'school_comms.announcement.read', label: 'Comunicación leída', entity: 'announcement', category: 'lifecycle' },
  ],
} as const)
