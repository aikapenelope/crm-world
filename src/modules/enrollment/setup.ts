import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['enrollment.*'],
    employee: ['enrollment.view', 'enrollment.manage_applications', 'enrollment.manage_documents'],
  },
}

export default setup
