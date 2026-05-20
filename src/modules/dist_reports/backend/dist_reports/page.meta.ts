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
  // PieChart icon (lucide)
  React.createElement('path', { d: 'M21.21 15.89A10 10 0 1 1 8 2.83' }),
  React.createElement('path', { d: 'M22 12A10 10 0 0 0 12 2v10z' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['dist_reports.view'],
  pageTitle: 'Reportes',
  pageTitleKey: 'dist_reports.nav.title',
  icon: reportsIcon,
  pageGroup: 'Distribución',
  pageGroupKey: 'distribution',
  pageOrder: 60,
}
