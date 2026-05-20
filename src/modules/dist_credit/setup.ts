import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_credit.*'],
    employee: ['dist_credit.view', 'dist_credit.view_aging', 'dist_credit.cobro'],
  },
}

export default setup
