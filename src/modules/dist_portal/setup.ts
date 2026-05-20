import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_portal.*'],
  },
  defaultCustomerRoleFeatures: {
    portal_admin: ['dist_portal.*'],
    buyer: ['dist_portal.view_account', 'dist_portal.place_order', 'dist_portal.view_orders'],
    viewer: ['dist_portal.view_account', 'dist_portal.view_orders'],
  },
}

export default setup
