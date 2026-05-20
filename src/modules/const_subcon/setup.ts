import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_subcon.*'],
    employee: ['const_subcon.view'],
  },
}
export default setup
