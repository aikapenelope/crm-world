import React from 'react'

const returnsIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('polyline', { points: '1 4 1 10 7 10' }),
  React.createElement('path', { d: 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_returns.view'],
  pageTitle: 'Devoluciones',
  pageTitleKey: 'retail_returns.nav.title',
  pageGroup: 'Retail',
  pageGroupKey: 'retail_returns.nav.group',
  pagePriority: 50,
  pageOrder: 140,
  icon: returnsIcon,
  breadcrumb: [{ label: 'Devoluciones', labelKey: 'retail_returns.nav.title' }],
}
