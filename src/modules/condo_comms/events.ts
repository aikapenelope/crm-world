import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'condo_comms',
  events: [
    { id: 'condo_comms.circular.published', label: 'Circular publicada', entity: 'circular', category: 'lifecycle' },
    { id: 'condo_comms.vote.opened', label: 'Votación abierta', entity: 'vote', category: 'lifecycle' },
    { id: 'condo_comms.vote.closed', label: 'Votación cerrada', entity: 'vote', category: 'lifecycle' },
    { id: 'condo_comms.vote.cast', label: 'Voto emitido', entity: 'vote_cast', category: 'lifecycle' },
    { id: 'condo_comms.assembly.completed', label: 'Asamblea completada', entity: 'assembly', category: 'lifecycle' },
  ],
} as const)
