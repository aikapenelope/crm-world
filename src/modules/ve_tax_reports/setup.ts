import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['ve_tax_reports.*'],
    employee: ['ve_tax_reports.view'],
  },
}

export default setup
