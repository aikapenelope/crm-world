import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_projects.*'],
    employee: ['const_projects.view'],
  },
}

export default setup
