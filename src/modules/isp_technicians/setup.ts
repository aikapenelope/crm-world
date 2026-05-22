import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['isp_technicians.view', 'isp_technicians.manage', 'isp_technicians.complete_orders', 'isp_technicians.view_reports'],
    employee: ['isp_technicians.view', 'isp_technicians.manage', 'isp_technicians.complete_orders'],
  },
}
export default setup
