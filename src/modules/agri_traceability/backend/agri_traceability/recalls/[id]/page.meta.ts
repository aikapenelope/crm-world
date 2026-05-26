import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_traceability.view'],
  pageTitle: 'Detalle de Recall',
  navHidden: true,
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
}