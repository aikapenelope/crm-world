import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = { defaultRoleFeatures: { superadmin: ['academy_portal.*'], admin: ['academy_portal.*'] } }
export default setup
