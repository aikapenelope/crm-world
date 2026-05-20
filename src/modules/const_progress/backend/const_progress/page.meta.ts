import React from 'react'

const progressIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['const_progress.view'],
  pageTitle: 'Valuaciones',
  pageTitleKey: 'const_progress.nav.title',
  icon: progressIcon,
  pageGroup: 'Construcción',
  pageGroupKey: 'construccion',
  pageOrder: 40,
}
