import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_routes.*'],
    employee: ['dist_routes.view', 'dist_routes.visit'],
  },
}

export default setup
