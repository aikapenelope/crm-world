import React from 'react'

const branchesIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
  React.createElement('polyline', { points: '9 22 9 12 15 12 15 22' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_branches.view'],
  pageTitle: 'Sucursales',
  pageTitleKey: 'retail_branches.nav.title',
  pageGroup: 'Retail',
  pageGroupKey: 'retail_branches.nav.group',
  pagePriority: 50,
  pageOrder: 100,
  icon: branchesIcon,
  breadcrumb: [{ label: 'Sucursales', labelKey: 'retail_branches.nav.title' }],
}
