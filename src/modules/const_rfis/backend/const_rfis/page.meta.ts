import React from 'react'

const rfisIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
  React.createElement('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
  React.createElement('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['const_rfis.view'],
  pageTitle: 'RFIs',
  pageTitleKey: 'const_rfis.nav.title',
  icon: rfisIcon,
  pageGroup: 'Construcción',
  pageGroupKey: 'construccion',
  pageOrder: 50,
}
