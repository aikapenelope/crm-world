import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_returns.*'],
    employee: ['retail_returns.view', 'retail_returns.create'],
  },
}

export default setup
