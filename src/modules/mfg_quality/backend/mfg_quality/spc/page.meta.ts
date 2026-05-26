import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_quality.view'],
  pageTitle: 'Cartas de Control SPC',
  navHidden: true,
  pageGroup: 'Manufactura',
  pageGroupKey: 'nav.group.mfg',
  pageOrder: 200,
}