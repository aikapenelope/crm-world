import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_feed.view'],
  pageTitle: 'Lotes de Alimento',
  pageTitleKey: 'agri_feed.nav.batches',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 21,
}
