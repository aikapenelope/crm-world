import React from 'react'

const reportsIcon = React.createElement(
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
  // BarChart3 icon (lucide)
  React.createElement('path', { d: 'M3 3v18h18' }),
  React.createElement('path', { d: 'M18 17V9' }),
  React.createElement('path', { d: 'M13 17V5' }),
  React.createElement('path', { d: 'M8 17v-3' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['ve_tax_reports.view'],
  pageTitle: 'Reportes Fiscales',
  pageTitleKey: 've_tax_reports.nav.title',
  icon: reportsIcon,
  pageGroup: 'Fiscal',
  pageGroupKey: 'fiscal',
  pageOrder: 30,
}
