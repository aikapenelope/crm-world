import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = { defaultRoleFeatures: { superadmin: ['academy_payments.*'], admin: ['academy_payments.*'], employee: ['academy_payments.view'] } }
export default setup
