import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_purchasing.*'],
    employee: ['retail_purchasing.view', 'retail_purchasing.create'],
  },
}

export default setup
