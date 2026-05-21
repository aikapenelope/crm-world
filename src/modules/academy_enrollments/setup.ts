import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['academy_enrollments.*'],
    admin: ['academy_enrollments.*'],
    employee: ['academy_enrollments.view'],
  },
}
export default setup
