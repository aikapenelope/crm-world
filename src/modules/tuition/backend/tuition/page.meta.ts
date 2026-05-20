import React from 'react'

const tuitionIcon = React.createElement(
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
  React.createElement('rect', { x: 2, y: 5, width: 20, height: 14, rx: 2 }),
  React.createElement('line', { x1: 2, y1: 10, x2: 22, y2: 10 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['tuition.view'],
  pageTitle: 'Mensualidades',
  pageTitleKey: 'tuition.nav.title',
  icon: tuitionIcon,
  pageGroup: 'Education',
  pageGroupKey: 'education',
  pageOrder: 30,
}
