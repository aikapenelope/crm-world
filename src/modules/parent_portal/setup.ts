import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: [],
  },
  defaultCustomerRoleFeatures: {
    portal_admin: ['parent_portal.view', 'parent_portal.payments', 'parent_portal.grades', 'parent_portal.attendance'],
    buyer: ['parent_portal.view', 'parent_portal.payments', 'parent_portal.grades', 'parent_portal.attendance'],
    viewer: ['parent_portal.view'],
  },
}

export default setup
