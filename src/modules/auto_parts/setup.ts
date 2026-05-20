import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['auto_parts.*'],
    employee: ['auto_parts.view'],
  },
}

export default setup
