import React from 'react'

const feesIcon = React.createElement(
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
  // Receipt/FileText icon
  React.createElement('path', { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }),
  React.createElement('polyline', { points: '14 2 14 8 20 8' }),
  React.createElement('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
  React.createElement('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
  React.createElement('line', { x1: 10, y1: 9, x2: 8, y2: 9 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['condo_fees.view'],
  pageTitle: 'Cuotas',
  pageTitleKey: 'condo_fees.nav.title',
  icon: feesIcon,
  pageGroup: 'Condominios',
  pageGroupKey: 'condominios',
  pageOrder: 20,
}
