import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_ecommerce.*'],
    employee: ['retail_ecommerce.view', 'retail_ecommerce.manage'],
  },
}

export default setup
