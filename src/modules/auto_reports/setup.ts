import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = { defaultRoleFeatures: { admin: ['auto_reports.*'], employee: ['auto_reports.view'] } }
export default setup
