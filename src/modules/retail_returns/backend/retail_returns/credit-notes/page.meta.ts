export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_returns.view'],
  pageTitle: 'Notas de Crédito',
  pageTitleKey: 'retail_returns.nav.credit_notes',
  navHidden: true,
  breadcrumb: [
    { label: 'Devoluciones', labelKey: 'retail_returns.nav.title', href: '/backend/retail_returns' },
    { label: 'Notas de Crédito', labelKey: 'retail_returns.nav.credit_notes' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 210,
}