import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['mfg_energy.*'], employee: ['mfg_energy.view', 'mfg_energy.record'] },
  async seedDefaults({ em, tenantId, organizationId }) { void em; void tenantId; void organizationId },
}
export default setup
