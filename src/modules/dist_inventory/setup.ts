import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_inventory.*'],
    employee: ['dist_inventory.view'],
  },
}

export default setup
