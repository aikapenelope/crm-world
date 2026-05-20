import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'condo_properties',
  events: [
    { id: 'condo_properties.building.created', label: 'Edificio creado', entity: 'building', category: 'crud' },
    { id: 'condo_properties.building.updated', label: 'Edificio actualizado', entity: 'building', category: 'crud' },
    { id: 'condo_properties.unit.created', label: 'Unidad creada', entity: 'unit', category: 'crud' },
    { id: 'condo_properties.unit.updated', label: 'Unidad actualizada', entity: 'unit', category: 'crud' },
    { id: 'condo_properties.area.created', label: 'Área común creada', entity: 'area', category: 'crud' },
  ],
} as const)
