import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['auto_vehicles.*'],
    employee: ['auto_vehicles.view', 'auto_vehicles.create', 'auto_vehicles.photos'],
  },
}

export default setup
