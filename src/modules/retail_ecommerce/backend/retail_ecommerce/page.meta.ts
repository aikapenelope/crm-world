import React from 'react'

const ecommerceIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('circle', { cx: 9, cy: 21, r: 1 }),
  React.createElement('circle', { cx: 20, cy: 21, r: 1 }),
  React.createElement('path', { d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_ecommerce.view'],
  pageTitle: 'E-commerce',
  pageTitleKey: 'retail_ecommerce.nav.title',
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pagePriority: 50,
  pageOrder: 150,
  icon: ecommerceIcon,
  breadcrumb: [{ label: 'E-commerce', labelKey: 'retail_ecommerce.nav.title' }],
}
