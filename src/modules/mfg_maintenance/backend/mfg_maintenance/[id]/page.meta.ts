import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true, requireFeatures: ['mfg_maintenance.view'],
  pageTitle: 'Detalle Equipo', navHidden: true,
  pageGroup: 'Manufactura',
  pageGroupKey: 'nav.group.mfg',
}