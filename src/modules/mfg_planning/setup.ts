import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['mfg_planning.*'], employee: ['mfg_planning.view'] },
  async seedDefaults({ em, tenantId, organizationId }) { void em; void tenantId; void organizationId },
}
export default setup
