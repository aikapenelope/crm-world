import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['mfg_dispatch.*'], employee: ['mfg_dispatch.view', 'mfg_dispatch.dispatch'] },
  async seedDefaults({ em, tenantId, organizationId }) { void em; void tenantId; void organizationId },
}
export default setup
