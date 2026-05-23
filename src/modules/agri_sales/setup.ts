import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_sales.*'],
    employee: ['agri_sales.view', 'agri_sales.create', 'agri_sales.edit'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    void em; void tenantId; void organizationId
  },
}
export default setup
