import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 've_tax_books',
  events: [
    { id: 've_tax_books.entry.created', label: 'Entrada fiscal creada', entity: 'entry', category: 'crud' },
    { id: 've_tax_books.entry.updated', label: 'Entrada fiscal actualizada', entity: 'entry', category: 'crud' },
    { id: 've_tax_books.entry.deleted', label: 'Entrada fiscal eliminada', entity: 'entry', category: 'crud' },
  ],
} as const)
