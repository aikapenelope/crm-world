import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'auto_vehicles',
  events: [
    { id: 'auto_vehicles.vehicle.created', label: 'Vehículo registrado', entity: 'vehicle', category: 'crud' },
    { id: 'auto_vehicles.vehicle.updated', label: 'Vehículo actualizado', entity: 'vehicle', category: 'crud' },
    { id: 'auto_vehicles.photo.uploaded', label: 'Foto subida', entity: 'photo', category: 'lifecycle' },
  ],
} as const)
