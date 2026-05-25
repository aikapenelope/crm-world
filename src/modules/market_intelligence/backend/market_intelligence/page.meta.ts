import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Tasación',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon: 'trending-up',
  pageOrder: 50,
  requireAuth: true,
  requireFeatures: ['market_intelligence.view'],
}
