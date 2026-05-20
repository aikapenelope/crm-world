import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_accounting.*'],
    employee: ['condo_accounting.view'],
  },
}

export default setup
