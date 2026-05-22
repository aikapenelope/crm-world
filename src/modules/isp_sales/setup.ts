import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: [
      'isp_sales.view', 'isp_sales.create_leads', 'isp_sales.manage_leads',
      'isp_sales.manage_coverage', 'isp_sales.view_commissions', 'isp_sales.approve_commissions',
    ],
    employee: [
      'isp_sales.view', 'isp_sales.create_leads', 'isp_sales.manage_leads',
      'isp_sales.view_commissions',
    ],
  },
}
export default setup
