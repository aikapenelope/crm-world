import React from 'react'

const bankIcon = React.createElement(
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
  // Landmark icon (lucide "landmark")
  React.createElement('line', { x1: 3, y1: 22, x2: 21, y2: 22 }),
  React.createElement('line', { x1: 6, y1: 18, x2: 6, y2: 11 }),
  React.createElement('line', { x1: 10, y1: 18, x2: 10, y2: 11 }),
  React.createElement('line', { x1: 14, y1: 18, x2: 14, y2: 11 }),
  React.createElement('line', { x1: 18, y1: 18, x2: 18, y2: 11 }),
  React.createElement('polygon', { points: '12 2 20 7 4 7' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['bank_reconciliation.view'],
  pageTitle: 'Conciliación Bancaria',
  pageTitleKey: 'bank_reconciliation.nav.title',
  icon: bankIcon,
  pageGroup: 'Fiscal',
  pageGroupKey: 'fiscal',
  pageOrder: 40,
}
