import React from 'react'

const inspectionIcon = React.createElement(
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
  // ClipboardCheck icon (lucide)
  React.createElement('rect', { width: 8, height: 4, x: 8, y: 2, rx: 1, ry: 1 }),
  React.createElement('path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' }),
  React.createElement('path', { d: 'm9 14 2 2 4-4' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['auto_inspections.view'],
  pageTitle: 'Inspecciones',
  pageTitleKey: 'auto_inspections.nav.title',
  icon: inspectionIcon,
  pageGroup: 'Taller',
  pageGroupKey: 'automotive',
  pageOrder: 30,
}
