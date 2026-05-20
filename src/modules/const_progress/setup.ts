import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_progress.*'],
    employee: ['const_progress.view', 'const_progress.manage'],
  },
}
export default setup
