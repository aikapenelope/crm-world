import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Tasación',
  group: 'Real Estate',
  icon: 'trending-up',
  order: 50,
  requireAuth: true,
  requireFeatures: ['market_intelligence.view'],
}
