import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_cold_chain.*'],
    employee: ['agri_cold_chain.view', 'agri_cold_chain.create'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    void em; void tenantId; void organizationId
  },
}
export default setup
