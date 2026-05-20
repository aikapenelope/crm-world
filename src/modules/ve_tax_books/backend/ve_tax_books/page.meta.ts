import React from 'react'

const taxBooksIcon = React.createElement(
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
  // Book icon (lucide "book-open")
  React.createElement('path', { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }),
  React.createElement('path', { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['ve_tax_books.view'],
  pageTitle: 'Libros Fiscales',
  pageTitleKey: 've_tax_books.nav.title',
  icon: taxBooksIcon,
  pageGroup: 'Fiscal',
  pageGroupKey: 'fiscal',
  pageOrder: 10,
}
