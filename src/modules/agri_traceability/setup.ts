import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_traceability.*'],
    employee: ['agri_traceability.view'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    void em; void tenantId; void organizationId
  },
}
export default setup
