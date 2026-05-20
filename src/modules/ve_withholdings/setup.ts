import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['ve_withholdings.*'],
    employee: ['ve_withholdings.view'],
  },
}

export default setup
