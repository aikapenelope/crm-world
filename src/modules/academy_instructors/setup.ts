import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['academy_instructors.*'],
    admin: ['academy_instructors.*'],
    employee: ['academy_instructors.view'],
  },
}

export default setup
