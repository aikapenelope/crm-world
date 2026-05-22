import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: [
      'isp_support.view', 'isp_support.create', 'isp_support.manage',
      'isp_support.assign', 'isp_support.resolve', 'isp_support.manage_outages',
      'isp_support.view_sla',
    ],
    employee: [
      'isp_support.view', 'isp_support.create', 'isp_support.manage',
      'isp_support.assign', 'isp_support.resolve',
    ],
  },
}
export default setup
