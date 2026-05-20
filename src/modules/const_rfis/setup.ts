import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_rfis.*'],
    employee: ['const_rfis.view', 'const_rfis.manage'],
  },
}
export default setup
