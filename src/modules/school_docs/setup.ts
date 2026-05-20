import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['school_docs.*'],
    employee: ['school_docs.view', 'school_docs.generate'],
  },
}

export default setup
