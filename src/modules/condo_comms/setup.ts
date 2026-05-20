import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_comms.*'],
    employee: ['condo_comms.view'],
  },
}

export default setup
