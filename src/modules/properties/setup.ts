import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['properties.*'],
    employee: ['properties.view', 'properties.create', 'properties.edit'],
  },
}

export default setup
