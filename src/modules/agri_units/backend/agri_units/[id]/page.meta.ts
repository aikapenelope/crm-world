import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_units.view'],
  pageTitle: 'Detalle de Lote',
  navHidden: true,
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
}