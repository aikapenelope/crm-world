import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['auto_service_orders.*'],
    employee: ['auto_service_orders.view', 'auto_service_orders.create', 'auto_service_orders.manage_status'],
  },
}

export default setup
