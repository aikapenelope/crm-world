import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['ve_fiscal.*'],
    employee: ['ve_fiscal.view'],
  },
}

export default setup
