import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['matching.*'],
    employee: ['matching.view', 'matching.run', 'matching.manage_preferences'],
  },
}

export default setup
