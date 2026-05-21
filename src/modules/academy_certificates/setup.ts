import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = { defaultRoleFeatures: { superadmin: ['academy_certificates.*'], admin: ['academy_certificates.*'], employee: ['academy_certificates.view'] } }
export default setup
