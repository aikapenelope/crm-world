import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_quality.view'],
  pageTitle: 'Detalle No-Conformidad',
  navHidden: true,
}
