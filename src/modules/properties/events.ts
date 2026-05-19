import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'properties',
  events: [
    { id: 'properties.property.created', label: 'Propiedad creada', entity: 'property' },
    { id: 'properties.property.updated', label: 'Propiedad actualizada', entity: 'property' },
    { id: 'properties.property.activated', label: 'Propiedad activada', entity: 'property' },
    { id: 'properties.property.reserved', label: 'Propiedad reservada', entity: 'property' },
    { id: 'properties.property.sold', label: 'Propiedad vendida', entity: 'property' },
    { id: 'properties.property.rented', label: 'Propiedad alquilada', entity: 'property' },
    { id: 'properties.property.deleted', label: 'Propiedad eliminada', entity: 'property' },
  ],
} as const)
