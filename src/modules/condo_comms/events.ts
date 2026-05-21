import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'condo_comms',
  events: [
    // clientBroadcast: circular needs real-time delivery to portal and backend
    { id: 'condo_comms.circular.published', label: 'Circular publicada', entity: 'circular', category: 'lifecycle', clientBroadcast: true },
    { id: 'condo_comms.vote.opened', label: 'Votación abierta', entity: 'vote', category: 'lifecycle', clientBroadcast: true },
    { id: 'condo_comms.vote.closed', label: 'Votación cerrada', entity: 'vote', category: 'lifecycle', clientBroadcast: true },
    // vote.cast must broadcast so vote counts update live on the results page
    { id: 'condo_comms.vote.cast', label: 'Voto emitido', entity: 'vote_cast', category: 'lifecycle', clientBroadcast: true },
    { id: 'condo_comms.assembly.completed', label: 'Asamblea completada', entity: 'assembly', category: 'lifecycle' },
  ],
} as const)
