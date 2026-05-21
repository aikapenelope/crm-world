import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['academy_sessions.*'],
    admin: ['academy_sessions.*'],
    employee: ['academy_sessions.view'],
  },
}
export default setup
