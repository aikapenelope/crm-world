import React from 'react'

const purchasingIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('path', { d: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' }),
  React.createElement('line', { x1: 3, y1: 6, x2: 21, y2: 6 }),
  React.createElement('path', { d: 'M16 10a4 4 0 0 1-8 0' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_purchasing.view'],
  pageTitle: 'Compras',
  pageTitleKey: 'retail_purchasing.nav.title',
  pageGroup: 'Retail',
  pageGroupKey: 'retail_purchasing.nav.group',
  pagePriority: 50,
  pageOrder: 160,
  icon: purchasingIcon,
  breadcrumb: [{ label: 'Compras', labelKey: 'retail_purchasing.nav.title' }],
}
