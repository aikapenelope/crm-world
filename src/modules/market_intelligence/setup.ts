import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['market_intelligence.*'],
    employee: ['market_intelligence.view', 'market_intelligence.valuate'],
  },
}

export default setup
