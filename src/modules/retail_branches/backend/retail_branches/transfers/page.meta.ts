import React from 'react'

const transferIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('polyline', { points: '17 1 21 5 17 9' }),
  React.createElement('path', { d: 'M3 11V9a4 4 0 0 1 4-4h14' }),
  React.createElement('polyline', { points: '7 23 3 19 7 15' }),
  React.createElement('path', { d: 'M21 13v2a4 4 0 0 1-4 4H3' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_branches.view'],
  pageTitle: 'Transferencias',
  pageTitleKey: 'retail_branches.nav.transfers',
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pagePriority: 50,
  pageOrder: 110,
  icon: transferIcon,
  breadcrumb: [
    { label: 'Sucursales', labelKey: 'retail_branches.nav.title', href: '/backend/retail_branches' },
    { label: 'Transferencias', labelKey: 'retail_branches.nav.transfers' },
  ],
}
