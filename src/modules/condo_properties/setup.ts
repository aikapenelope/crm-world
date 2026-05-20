import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_properties.*'],
    employee: ['condo_properties.view'],
  },
}

export default setup
