import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_inventory.*'],
    employee: ['retail_inventory.view', 'retail_inventory.count'],
  },
}

export default setup
