import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['transactions.*'],
    employee: ['transactions.view', 'transactions.create'],
  },
}

export default setup
