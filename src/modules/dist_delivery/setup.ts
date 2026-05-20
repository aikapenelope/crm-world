import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_delivery.*'],
    employee: ['dist_delivery.view', 'dist_delivery.confirm'],
  },
}

export default setup
