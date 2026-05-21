import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'isp_network',
  events: [
    { id: 'isp_network.node.outage_reported',  label: 'Nodo caído reportado',    entity: 'node', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_network.node.restored',         label: 'Nodo recuperado',          entity: 'node', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_network.node.capacity_alert',   label: 'Alerta de capacidad',      entity: 'node', category: 'lifecycle' },
    { id: 'isp_network.cpe.deployed',          label: 'CPE instalado en cliente', entity: 'cpe',  category: 'lifecycle' },
    { id: 'isp_network.cpe.uninstalled',       label: 'CPE retirado de cliente',  entity: 'cpe',  category: 'lifecycle' },
    { id: 'isp_network.cpe.low_stock',         label: 'Stock CPE bajo',           entity: 'cpe',  category: 'lifecycle', clientBroadcast: true },
  ],
} as const)
