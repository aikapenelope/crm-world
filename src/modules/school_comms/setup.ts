import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['school_comms.*'],
    employee: ['school_comms.view', 'school_comms.create'],
  },
}

export default setup
