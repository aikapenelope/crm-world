import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['mfg_hr.*'], employee: ['mfg_hr.view', 'mfg_hr.labor'] },
  async seedDefaults({ em, tenantId, organizationId }) { void em; void tenantId; void organizationId },
}
export default setup
