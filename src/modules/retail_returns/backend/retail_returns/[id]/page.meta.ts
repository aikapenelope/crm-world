export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_returns.view'],
  pageTitle: 'Detalle Devolución',
  navHidden: true,
  breadcrumb: [
    { label: 'Devoluciones', labelKey: 'retail_returns.nav.title', href: '/backend/retail_returns' },
    { label: 'Detalle' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
}