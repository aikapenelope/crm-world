import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: [
      'isp_network.view', 'isp_network.manage',
      'isp_network.manage_cpe', 'isp_network.report_outage',
    ],
    employee: [
      'isp_network.view', 'isp_network.manage_cpe', 'isp_network.report_outage',
    ],
  },
}
export default setup
