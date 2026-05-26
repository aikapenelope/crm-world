import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true, requireFeatures: ['mfg_dispatch.view'],
  pageTitle: 'Detalle Pedido / Guía', navHidden: true,
  pageGroup: 'Manufactura',
  pageGroupKey: 'nav.group.mfg',
  navHidden: true,
}