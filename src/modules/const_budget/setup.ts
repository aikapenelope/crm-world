import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_budget.*'],
    employee: ['const_budget.view'],
  },
}
export default setup
