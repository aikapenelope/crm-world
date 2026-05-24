import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_bom.view'],
  pageTitle: 'Detalle BOM',
  navHidden: true,
}
