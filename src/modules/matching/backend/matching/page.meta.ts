import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

// git-compare icon — lucide-react
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
  React.createElement('circle', { cx: 18, cy: 18, r: 3 }),
  React.createElement('circle', { cx: 6, cy: 6, r: 3 }),
  React.createElement('path', { d: 'M13 6h3a2 2 0 0 1 2 2v7' }),
  React.createElement('path', { d: 'M11 18H8a2 2 0 0 1-2-2V9' }),
)

export const metadata: PageMetadata = {
  title: 'Matching',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon,
  pageOrder: 30,
  requireAuth: true,
  requireFeatures: ['matching.view'],
}
