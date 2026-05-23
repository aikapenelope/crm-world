import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['mfg_inventory.*'],
    employee: ['mfg_inventory.view', 'mfg_inventory.receive', 'mfg_inventory.issue'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    void em; void tenantId; void organizationId
    // No default data needed — locations and lots are operation-specific
  },
}
export default setup
