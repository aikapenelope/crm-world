import React from 'react'

const loyaltyIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' })
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_loyalty.view'],
  pageTitle: 'Fidelización',
  pageTitleKey: 'retail_loyalty.nav.title',
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pagePriority: 50,
  pageOrder: 130,
  icon: loyaltyIcon,
  breadcrumb: [{ label: 'Fidelización', labelKey: 'retail_loyalty.nav.title' }],
}
