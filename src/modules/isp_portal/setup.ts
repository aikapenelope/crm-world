import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  // Portal features granted to customer roles via customer_accounts module
  defaultCustomerRoleFeatures: {
    portal_admin: ['isp_portal.view_account', 'isp_portal.view_tickets', 'isp_portal.create_ticket', 'isp_portal.report_payment'],
    buyer:        ['isp_portal.view_account', 'isp_portal.view_tickets', 'isp_portal.create_ticket', 'isp_portal.report_payment'],
    viewer:       ['isp_portal.view_account', 'isp_portal.view_tickets'],
  },
}
export default setup
