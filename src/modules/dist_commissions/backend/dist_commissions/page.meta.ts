import React from 'react'

const commissionsIcon = React.createElement(
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
  // Percent icon (lucide)
  React.createElement('line', { x1: 19, y1: 5, x2: 5, y2: 19 }),
  React.createElement('circle', { cx: 6.5, cy: 6.5, r: 2.5 }),
  React.createElement('circle', { cx: 17.5, cy: 17.5, r: 2.5 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['dist_commissions.view'],
  pageTitle: 'Comisiones',
  pageTitleKey: 'dist_commissions.nav.title',
  icon: commissionsIcon,
  pageGroup: 'Distribución',
  pageGroupKey: 'distribution',
  pageOrder: 70,
}
