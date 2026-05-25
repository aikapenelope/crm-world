import React from 'react'

const pricingIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('line', { x1: 12, y1: 1, x2: 12, y2: 23 }),
  React.createElement('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_pricing.view'],
  pageTitle: 'Pricing',
  pageTitleKey: 'retail_pricing.nav.title',
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pagePriority: 50,
  pageOrder: 170,
  icon: pricingIcon,
  breadcrumb: [{ label: 'Pricing', labelKey: 'retail_pricing.nav.title' }],
}
