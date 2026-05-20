import React from 'react'

const budgetIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
  React.createElement('polyline', { points: '14 2 14 8 20 8' }),
  React.createElement('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
  React.createElement('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
  React.createElement('polyline', { points: '10 9 9 9 8 9' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['const_budget.view'],
  pageTitle: 'Presupuesto',
  pageTitleKey: 'const_budget.nav.title',
  icon: budgetIcon,
  pageGroup: 'Construcción',
  pageGroupKey: 'construccion',
  pageOrder: 20,
}
