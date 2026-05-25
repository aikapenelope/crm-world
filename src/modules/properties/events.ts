import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'properties',
  events: [
    { id: 'properties.property.created',   label: 'Propiedad creada',      entity: 'property', category: 'crud' },
    { id: 'properties.property.updated',   label: 'Propiedad actualizada', entity: 'property', category: 'crud' },
    { id: 'properties.property.activated', label: 'Propiedad activada',    entity: 'property', category: 'lifecycle' },
    { id: 'properties.property.reserved',  label: 'Propiedad reservada',   entity: 'property', category: 'lifecycle' },
    { id: 'properties.property.sold',      label: 'Propiedad vendida',     entity: 'property', category: 'lifecycle' },
    { id: 'properties.property.rented',    label: 'Propiedad alquilada',   entity: 'property', category: 'lifecycle' },
    { id: 'properties.property.deleted',   label: 'Propiedad eliminada',   entity: 'property', category: 'crud' },
  ],
} as const)
