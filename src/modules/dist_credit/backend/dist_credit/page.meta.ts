import React from 'react'

const creditIcon = React.createElement(
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
  // CreditCard icon (lucide)
  React.createElement('rect', { width: 20, height: 14, x: 2, y: 5, rx: 2 }),
  React.createElement('line', { x1: 2, y1: 10, x2: 22, y2: 10 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['dist_credit.view'],
  pageTitle: 'Cuentas por Cobrar',
  pageTitleKey: 'dist_credit.nav.title',
  icon: creditIcon,
  pageGroup: 'Distribución',
  pageGroupKey: 'distribution',
  pageOrder: 10,
}
