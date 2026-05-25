import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Vertical de Negocio',
  requireAuth: true,
  requireFeatures: ['vertical_presets.view'],
  pageGroup: 'Super Admin',
  pageGroupKey: 'nav.group.superadmin',
  pageOrder: 10,
}
