import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_maintenance.*'],
    employee: ['condo_maintenance.view', 'condo_maintenance.manage'],
  },
}

export default setup
