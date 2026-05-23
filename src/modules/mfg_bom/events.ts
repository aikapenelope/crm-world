import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_bom',
  events: [
    { id: 'mfg_bom.created',         label: 'BOM creado',                        entity: 'bom',     category: 'crud' },
    { id: 'mfg_bom.activated',        label: 'Versión de BOM activada',           entity: 'bom',     category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_bom.superseded',       label: 'Versión de BOM reemplazada',        entity: 'bom',     category: 'lifecycle' },
    { id: 'mfg_bom.alternative_added', label: 'Material alternativo añadido al BOM', entity: 'bom',  category: 'crud' },
  ],
} as const)
