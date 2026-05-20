import React from 'react'

const gradesIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20' }),
  React.createElement('path', { d: 'm9 10 2 2 4-4' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['grades.view'],
  pageTitle: 'Notas',
  pageTitleKey: 'grades.nav.title',
  icon: gradesIcon,
  pageGroup: 'Education',
  pageGroupKey: 'education',
  pageOrder: 40,
}
