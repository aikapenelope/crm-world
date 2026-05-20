import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_price_lists.*'],
    employee: ['dist_price_lists.view'],
  },
}

export default setup
