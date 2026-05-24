import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_units.view'],
  pageTitle: 'Granjas y Galpones',
  pageTitleKey: 'agri_units.nav.farm_units',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 11
}
