import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_schedule.*'],
    employee: ['const_schedule.view'],
  },
}
export default setup
