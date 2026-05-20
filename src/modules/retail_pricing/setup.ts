import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_pricing.*'],
    employee: ['retail_pricing.view', 'retail_pricing.alerts'],
  },
}

export default setup
