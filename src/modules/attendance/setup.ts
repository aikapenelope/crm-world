import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['attendance.*'],
    employee: ['attendance.view', 'attendance.record'],
  },
}

export default setup
