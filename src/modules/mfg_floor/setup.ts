import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['mfg_floor.*'], employee: ['mfg_floor.view', 'mfg_floor.edit'] },
  async seedDefaults({ em, tenantId, organizationId }) { void em; void tenantId; void organizationId },
}
export default setup
