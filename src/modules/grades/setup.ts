import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['grades.*'],
    employee: ['grades.view', 'grades.record'],
  },
}

export default setup
