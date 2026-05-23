import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_cold_chain.view'],
  pageTitle: 'Lecturas de Temperatura',
  pageTitleKey: 'agri_cold_chain.nav.readings',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 56,
}
