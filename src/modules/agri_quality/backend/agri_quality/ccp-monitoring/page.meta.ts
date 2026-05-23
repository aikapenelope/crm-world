import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_quality.create'],
  pageTitle: 'Monitoreo de PCCs',
  pageTitleKey: 'agri_quality.nav.ccp_monitoring',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 63,
}
