import React from 'react'

const accountingIcon = React.createElement(
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
  // Calculator icon
  React.createElement('rect', { width: 16, height: 20, x: 4, y: 2, rx: 2 }),
  React.createElement('line', { x1: 8, y1: 6, x2: 16, y2: 6 }),
  React.createElement('line', { x1: 16, y1: 14, x2: 16, y2: 18 }),
  React.createElement('line', { x1: 8, y1: 10, x2: 8.01, y2: 10 }),
  React.createElement('line', { x1: 12, y1: 10, x2: 12.01, y2: 10 }),
  React.createElement('line', { x1: 16, y1: 10, x2: 16.01, y2: 10 }),
  React.createElement('line', { x1: 8, y1: 14, x2: 8.01, y2: 14 }),
  React.createElement('line', { x1: 12, y1: 14, x2: 12.01, y2: 14 }),
  React.createElement('line', { x1: 8, y1: 18, x2: 8.01, y2: 18 }),
  React.createElement('line', { x1: 12, y1: 18, x2: 12.01, y2: 18 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['condo_accounting.view'],
  pageTitle: 'Contabilidad',
  pageTitleKey: 'condo_accounting.nav.title',
  icon: accountingIcon,
  pageGroup: 'Condominios',
  pageGroupKey: 'condominios',
  pageOrder: 50,
}
