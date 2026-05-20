import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['ve_tax_books.*'],
    employee: ['ve_tax_books.view'],
  },
}

export default setup
