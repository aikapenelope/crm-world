import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: [
      'isp_subscribers.view', 'isp_subscribers.create', 'isp_subscribers.edit',
      'isp_subscribers.delete', 'isp_subscribers.suspend', 'isp_subscribers.manage_contracts',
      'isp_subscribers.view_financials',
    ],
    employee: [
      'isp_subscribers.view', 'isp_subscribers.create', 'isp_subscribers.edit',
      'isp_subscribers.suspend', 'isp_subscribers.view_financials',
    ],
  },
}
export default setup
