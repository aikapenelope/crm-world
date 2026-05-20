import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_fees.*'],
    employee: ['condo_fees.view', 'condo_fees.collect'],
  },
}

export default setup
