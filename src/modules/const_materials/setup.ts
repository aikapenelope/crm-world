import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_materials.*'],
    employee: ['const_materials.view', 'const_materials.receive'],
  },
}
export default setup
