export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_returns.policies'],
  pageTitle: 'Políticas de Devolución',
  pageTitleKey: 'retail_returns.nav.policies',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Devoluciones', labelKey: 'retail_returns.nav.title', href: '/backend/retail_returns' },
    { label: 'Políticas', labelKey: 'retail_returns.nav.policies' },
  ],
}
