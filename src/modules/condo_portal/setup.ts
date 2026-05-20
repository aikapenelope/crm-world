import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_portal.*'],
  },
  defaultCustomerRoleFeatures: {
    portal_admin: ['condo_portal.*'],
    owner: ['condo_portal.view_account', 'condo_portal.report_payment', 'condo_portal.maintenance', 'condo_portal.circulars', 'condo_portal.vote', 'condo_portal.documents'],
    resident: ['condo_portal.view_account', 'condo_portal.maintenance', 'condo_portal.circulars'],
  },
}

export default setup
