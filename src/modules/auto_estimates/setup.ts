import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['auto_estimates.*'], employee: ['auto_estimates.view', 'auto_estimates.create', 'auto_estimates.send'] },
}
export default setup
