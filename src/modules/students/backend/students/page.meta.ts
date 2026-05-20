import React from 'react'

const studentsIcon = React.createElement(
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
  React.createElement('path', { d: 'M22 10v6M2 10l10-5 10 5-10 5z' }),
  React.createElement('path', { d: 'M6 12v5c0 2 2 3 6 3s6-1 6-3v-5' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['students.view'],
  pageTitle: 'Estudiantes',
  pageTitleKey: 'students.nav.title',
  icon: studentsIcon,
  pageGroup: 'Education',
  pageGroupKey: 'education',
  pageOrder: 10,
}
