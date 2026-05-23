import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_processing.*'],
    employee: ['agri_processing.view', 'agri_processing.create', 'agri_processing.edit'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    void em; void tenantId; void organizationId
  },
}
export default setup
