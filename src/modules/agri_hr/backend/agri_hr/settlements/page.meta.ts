import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_hr.view'],
  pageTitle: 'Liquidaciones Productores',
  pageTitleKey: 'agri_hr.nav.settlements',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 86,
}
