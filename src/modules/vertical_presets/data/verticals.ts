/**
 * Definición canónica de las 12 verticales de negocio de la plataforma Aika.
 * Cada vertical agrupa los módulos relevantes y define su identidad visual.
 *
 * Esta es la fuente de verdad para el selector de onboarding, el sidebar
 * agrupado y la siembra condicional de datos por vertical.
 */

export type VerticalKey =
  | 'real_estate'
  | 'education'
  | 'distribution'
  | 'automotive'
  | 'retail'
  | 'condominios'
  | 'construction'
  | 'academy'
  | 'isp'
  | 'agri'
  | 'manufacturing'
  | 'fiscal_ve'

export type VerticalDefinition = {
  key: VerticalKey
  /** Nombre en español para mostrar al usuario */
  label: string
  /** Descripción corta del caso de uso */
  description: string
  /** Color hexadecimal del acento visual */
  color: string
  /** Nombre de ícono Lucide */
  icon: string
  /** Módulos que pertenecen a esta vertical */
  modules: readonly string[]
  /** pageGroupKey usado en los page.meta.ts de esta vertical */
  navGroupKey: string
}

export const VERTICALS: readonly VerticalDefinition[] = [
  {
    key: 'real_estate',
    label: 'Inmobiliaria',
    description: 'Propiedades, transacciones, agentes y portal de clientes',
    color: '#3b82f6',
    icon: 'building-2',
    navGroupKey: 'nav.group.realestate',
    modules: [
      'properties',
      'transactions',
      'matching',
      'property_portal',
      'property_docs',
      'property_publishing',
      'mercadolibre_sync',
      'market_intelligence',
    ],
  },
  {
    key: 'education',
    label: 'Educación / Colegios',
    description: 'Alumnos, inscripciones, cobranza escolar, comunicaciones y portal de padres',
    color: '#8b5cf6',
    icon: 'graduation-cap',
    navGroupKey: 'education',
    modules: [
      'students',
      'enrollment',
      'tuition',
      'grades',
      'attendance',
      'school_calendar',
      'school_comms',
      'school_docs',
      'parent_portal',
      'school_migration',
    ],
  },
  {
    key: 'distribution',
    label: 'Distribución',
    description: 'Inventario, rutas, despacho, crédito y comisiones para distribuidores',
    color: '#f97316',
    icon: 'truck',
    navGroupKey: 'distribution',
    modules: [
      'dist_credit',
      'dist_price_lists',
      'dist_inventory',
      'dist_routes',
      'dist_delivery',
      'dist_reports',
      'dist_commissions',
      'dist_portal',
    ],
  },
  {
    key: 'automotive',
    label: 'Taller Automotriz',
    description: 'Vehículos, órdenes de servicio, inspecciones, repuestos y presupuestos',
    color: '#ef4444',
    icon: 'car',
    navGroupKey: 'automotive',
    modules: [
      'auto_vehicles',
      'auto_service_orders',
      'auto_inspections',
      'auto_parts',
      'auto_estimates',
      'auto_reports',
      'auto_portal',
    ],
  },
  {
    key: 'retail',
    label: 'Retail / Comercio',
    description: 'Sucursales, inventario, precios, lealtad, devoluciones y e-commerce',
    color: '#ec4899',
    icon: 'shopping-bag',
    navGroupKey: 'retail.nav.group',
    modules: [
      'retail_branches',
      'retail_inventory',
      'retail_loyalty',
      'retail_returns',
      'retail_ecommerce',
      'retail_purchasing',
      'retail_pricing',
    ],
  },
  {
    key: 'condominios',
    label: 'Condominios',
    description: 'Propietarios, cuotas, cobranza, mantenimiento, comunicados y portal',
    color: '#06b6d4',
    icon: 'home',
    navGroupKey: 'condominios',
    modules: [
      'condo_properties',
      'condo_fees',
      'condo_collections',
      'condo_maintenance',
      'condo_accounting',
      'condo_comms',
      'condo_portal',
    ],
  },
  {
    key: 'construction',
    label: 'Construcción',
    description: 'Proyectos, presupuesto, cronograma, RFIs, subcontratistas y materiales',
    color: '#d97706',
    icon: 'hard-hat',
    navGroupKey: 'construccion',
    modules: [
      'const_projects',
      'const_budget',
      'const_schedule',
      'const_progress',
      'const_rfis',
      'const_daily',
      'const_subcon',
      'const_materials',
    ],
  },
  {
    key: 'academy',
    label: 'Academia / Formación',
    description: 'Cursos, instructores, grupos, sesiones, inscripciones, pagos y certificados',
    color: '#10b981',
    icon: 'book-open',
    navGroupKey: 'nav.group.academy',
    modules: [
      'academy_courses',
      'academy_instructors',
      'academy_groups',
      'academy_sessions',
      'academy_enrollments',
      'academy_attendance',
      'academy_payments',
      'academy_certificates',
      'academy_portal',
    ],
  },
  {
    key: 'isp',
    label: 'ISP / Telecomunicaciones',
    description: 'Planes, infraestructura, abonados, facturación, soporte y técnicos de campo',
    color: '#6366f1',
    icon: 'wifi',
    navGroupKey: 'nav.group.isp',
    modules: [
      'isp_plans',
      'isp_network',
      'isp_subscribers',
      'isp_billing',
      'isp_support',
      'isp_technicians',
      'isp_sales',
      'isp_portal',
    ],
  },
  {
    key: 'agri',
    label: 'Agroindustria',
    description: 'Producción primaria, planta, cadena de frío, calidad, trazabilidad y ventas',
    color: '#84cc16',
    icon: 'sprout',
    navGroupKey: 'nav.group.agri',
    modules: [
      'agri_units',
      'agri_feed',
      'agri_vet',
      'agri_inputs',
      'agri_processing',
      'agri_cold_chain',
      'agri_quality',
      'agri_traceability',
      'agri_sales',
      'agri_field',
      'agri_hr',
      'agri_portal',
    ],
  },
  {
    key: 'manufacturing',
    label: 'Manufactura Industrial',
    description: 'BOM, MRP, MES, planta, calidad, costos bimoneda y portal del cliente',
    color: '#64748b',
    icon: 'factory',
    navGroupKey: 'nav.group.mfg',
    modules: [
      'mfg_bom',
      'mfg_inventory',
      'mfg_orders',
      'mfg_quality',
      'mfg_mrp',
      'mfg_floor',
      'mfg_planning',
      'mfg_costs',
      'mfg_maintenance',
      'mfg_procurement',
      'mfg_subcontract',
      'mfg_energy',
      'mfg_dispatch',
      'mfg_hr',
      'mfg_reports',
      'mfg_portal',
    ],
  },
  {
    key: 'fiscal_ve',
    label: 'Fiscal Venezuela (transversal)',
    description: 'Libros IVA, retenciones, reportes fiscales y conciliación bancaria',
    color: '#dc2626',
    icon: 'file-text',
    navGroupKey: 'fiscal',
    modules: [
      've_tax_books',
      've_withholdings',
      've_tax_reports',
      'bank_reconciliation',
    ],
  },
] as const

/**
 * Lookup helper — retorna la definición de una vertical por su key.
 * Retorna undefined si la key no existe (evita throws en runtime).
 */
export function getVertical(key: string): VerticalDefinition | undefined {
  return VERTICALS.find((v) => v.key === key)
}

/** Todas las keys válidas como array (útil para validación Zod). */
export const VERTICAL_KEYS = VERTICALS.map((v) => v.key) as [VerticalKey, ...VerticalKey[]]
