import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_units.*'],
    employee: ['agri_units.view', 'agri_units.weekly_record'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    // No default seed data required — farm units and flocks are
    // specific to each operation and must be created by the user.
    void em
    void tenantId
    void organizationId
  },
}
export default setup
