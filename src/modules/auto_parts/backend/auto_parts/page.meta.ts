import React from 'react'

const partsIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M12 2v4' }),
  React.createElement('path', { d: 'M12 18v4' }),
  React.createElement('path', { d: 'M4.93 4.93l2.83 2.83' }),
  React.createElement('path', { d: 'M16.24 16.24l2.83 2.83' }),
  React.createElement('path', { d: 'M2 12h4' }),
  React.createElement('path', { d: 'M18 12h4' }),
  React.createElement('path', { d: 'M4.93 19.07l2.83-2.83' }),
  React.createElement('path', { d: 'M16.24 7.76l2.83-2.83' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['auto_parts.view'],
  pageTitle: 'Repuestos',
  pageTitleKey: 'auto_parts.nav.title',
  icon: partsIcon,
  pageGroup: 'Taller',
  pageGroupKey: 'automotive',
  pageOrder: 40,
}
