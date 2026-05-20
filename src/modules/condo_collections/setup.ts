import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_collections.*'],
    employee: ['condo_collections.view', 'condo_collections.manage'],
  },
}

export default setup
