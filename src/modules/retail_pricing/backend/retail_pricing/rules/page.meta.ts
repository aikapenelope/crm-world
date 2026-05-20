export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_pricing.rules'],
  pageTitle: 'Reglas de Margen',
  pageTitleKey: 'retail_pricing.nav.rules',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Pricing', labelKey: 'retail_pricing.nav.title', href: '/backend/retail_pricing' },
    { label: 'Reglas', labelKey: 'retail_pricing.nav.rules' },
  ],
}
