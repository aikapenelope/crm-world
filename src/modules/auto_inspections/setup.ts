import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['auto_inspections.*'],
    employee: ['auto_inspections.view', 'auto_inspections.create', 'auto_inspections.send'],
  },
}

export default setup
