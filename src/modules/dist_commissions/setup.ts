import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_commissions.*'],
    employee: ['dist_commissions.view'],
  },
}

export default setup
