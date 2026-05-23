import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_quality.view'],
  pageTitle: 'Planes HACCP',
  pageTitleKey: 'agri_quality.nav.haccp_plans',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 62,
}
