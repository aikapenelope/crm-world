import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_inputs.*'],
    employee: ['agri_inputs.view', 'agri_inputs.create'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    void em
    void tenantId
    void organizationId
  },
}
export default setup
