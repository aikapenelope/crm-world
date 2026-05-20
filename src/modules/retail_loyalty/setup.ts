import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_loyalty.*'],
    employee: ['retail_loyalty.view'],
  },
}

export default setup
