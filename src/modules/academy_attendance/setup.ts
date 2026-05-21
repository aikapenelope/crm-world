import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = { defaultRoleFeatures: { superadmin: ['academy_attendance.*'], admin: ['academy_attendance.*'], employee: ['academy_attendance.view'] } }
export default setup
