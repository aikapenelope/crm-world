import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['academy_groups.*'],
    admin: ['academy_groups.*'],
    employee: ['academy_groups.view'],
  },
}
export default setup
