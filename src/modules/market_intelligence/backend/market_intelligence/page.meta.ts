import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

// trending-up icon — lucide-react
const icon = React.createElement(
  'svg',
  {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  React.createElement('path', { d: 'M16 7h6v6' }),
  React.createElement('path', { d: 'm22 7-8.5 8.5-5-5L2 17' }),
)

export const metadata: PageMetadata = {
  title: 'Tasación',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon,
  pageOrder: 50,
  requireAuth: true,
  requireFeatures: ['market_intelligence.view'],
}
