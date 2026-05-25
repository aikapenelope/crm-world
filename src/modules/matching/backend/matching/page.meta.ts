import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Matching',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon: 'git-compare',
  pageOrder: 30,
  requireAuth: true,
  requireFeatures: ['matching.view'],
}
