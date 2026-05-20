import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['tuition.*'],
    employee: ['tuition.view', 'tuition.record_payment', 'tuition.view_debtors'],
  },
}

export default setup
