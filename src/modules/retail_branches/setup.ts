import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_branches.*'],
    employee: ['retail_branches.view', 'retail_branches.transfer'],
  },
}

export default setup
