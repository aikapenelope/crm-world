export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_returns.create'],
  pageTitle: 'Nueva Devolución',
  pageTitleKey: 'retail_returns.return.create',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Devoluciones', labelKey: 'retail_returns.nav.title', href: '/backend/retail_returns' },
    { label: 'Nueva', labelKey: 'retail_returns.return.create' },
  ],
}
