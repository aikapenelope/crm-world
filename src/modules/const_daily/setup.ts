import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_daily.*'],
    employee: ['const_daily.view', 'const_daily.manage'],
  },
}
export default setup
