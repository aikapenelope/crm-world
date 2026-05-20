import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['auto_portal.*'] },
  defaultCustomerRoleFeatures: { portal_admin: ['auto_portal.*'], buyer: ['auto_portal.view_status', 'auto_portal.view_inspection', 'auto_portal.approve_estimate'], viewer: ['auto_portal.view_status'] },
}
export default setup
