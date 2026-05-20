import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_reports.*'],
    employee: ['dist_reports.view'],
  },
}

export default setup
