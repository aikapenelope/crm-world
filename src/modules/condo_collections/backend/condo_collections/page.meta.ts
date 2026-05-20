import React from 'react'

const collectionsIcon = React.createElement(
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
  // AlertCircle icon (morosidad)
  React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
  React.createElement('line', { x1: 12, y1: 8, x2: 12, y2: 12 }),
  React.createElement('line', { x1: 12, y1: 16, x2: 12.01, y2: 16 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['condo_collections.view'],
  pageTitle: 'Cobranza',
  pageTitleKey: 'condo_collections.nav.title',
  icon: collectionsIcon,
  pageGroup: 'Condominios',
  pageGroupKey: 'condominios',
  pageOrder: 30,
}
