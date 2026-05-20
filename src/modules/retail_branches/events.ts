import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'retail_branches',
  events: [
    { id: 'retail_branches.branch.created', label: 'Sucursal creada', entity: 'branch', category: 'crud' },
    { id: 'retail_branches.branch.updated', label: 'Sucursal actualizada', entity: 'branch', category: 'crud' },
    { id: 'retail_branches.transfer.created', label: 'Transferencia creada', entity: 'transfer', category: 'crud' },
    { id: 'retail_branches.transfer.approved', label: 'Transferencia aprobada', entity: 'transfer', category: 'lifecycle' },
    { id: 'retail_branches.transfer.received', label: 'Transferencia recibida', entity: 'transfer', category: 'lifecycle' },
    { id: 'retail_branches.staff.assigned', label: 'Personal asignado', entity: 'staff', category: 'lifecycle' },
  ],
} as const)
