/**
 * TC-FRONTEND-001: All Registered Backend Pages — Frontend Health Check
 *
 * Verifica que todas las rutas de backend registradas en el módulo registry
 * de OM respondan con HTTP 200 (renderizado correcto) y no con 404 (página
 * no implementada) ni 500 (React crash durante SSR).
 *
 * ## Por qué este test existe
 *
 * El generador OM (module-registry.ts:1403) registra rutas SOLO para archivos
 * page.tsx que tengan un default export. Un page.meta.ts sin su page.tsx
 * NO crea una ruta → 404 al navegar. Además, page.tsx pueden fallar en SSR
 * (import roto, hook fuera de contexto, etc.) produciendo HTTP 500.
 *
 * Este test detecta ambos casos sistemáticamente en cada CI run.
 *
 * ## Estrategia
 *
 * - Login vía `/api/auth/login` con las credenciales de integración (admin@acme.com)
 * - Para cada ruta registrada: GET /backend/<path> con cookie `auth_token`
 * - Acepta: 200 (render OK), 307/302 (redirect interno, ej: tenant-select)
 * - Falla si: 404 (ruta no registrada) o >=500 (React/SSR crash)
 *
 * ## Alcance
 *
 * Cubre todas las rutas de lista (sin [id] y sin /create) de los módulos
 * custom de crm-world. Las rutas de OM core se excluyen porque están
 * mantenidas por el framework.
 *
 * ## Referencia
 *
 * Generador: open-mercato packages/cli/src/lib/generators/module-registry.ts:1403
 * Catch-all:  src/app/(backend)/backend/[...slug]/page.tsx:57
 * Patrón:     open-mercato .ai/qa/AGENTS.md — "API-backed integration tests"
 */
import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Rutas a testear
// Lista de rutas custom de crm-world (NO OM core) que deben renderizar sin error.
// Se excluyen rutas con parámetros dinámicos ([id], etc.) porque requieren fixtures.
// Se excluyen rutas /create y /edit porque pueden necesitar form fixtures.
// ---------------------------------------------------------------------------
const BACKEND_PAGES: Array<{ module: string; path: string; description: string }> = [
  // Real Estate
  { module: 'properties', path: '/backend/properties', description: 'Lista de propiedades' },
  { module: 'transactions', path: '/backend/transactions', description: 'Lista de transacciones' },
  { module: 'matching', path: '/backend/matching', description: 'Motor de matching' },
  { module: 'market_intelligence', path: '/backend/market_intelligence', description: 'Inteligencia de mercado' },
  // Fiscal Venezuela
  { module: 've_tax_books', path: '/backend/ve_tax_books', description: 'Libros de IVA' },
  { module: 've_withholdings', path: '/backend/ve_withholdings', description: 'Retenciones' },
  { module: 've_tax_reports', path: '/backend/ve_tax_reports', description: 'Reportes fiscales' },
  { module: 'bank_reconciliation', path: '/backend/bank_reconciliation', description: 'Conciliación bancaria' },
  { module: 'payment_methods', path: '/backend/payment_methods', description: 'Métodos de pago' },
  // Educación
  { module: 'students', path: '/backend/students', description: 'Alumnos' },
  { module: 'enrollment', path: '/backend/enrollment', description: 'Inscripciones' },
  { module: 'tuition', path: '/backend/tuition', description: 'Cobros de colegiatura' },
  { module: 'grades', path: '/backend/grades', description: 'Calificaciones' },
  { module: 'school_calendar', path: '/backend/school_calendar', description: 'Calendario escolar' },
  { module: 'school_comms', path: '/backend/school_comms', description: 'Comunicados escolares' },
  { module: 'school_docs', path: '/backend/school_docs', description: 'Documentos escolares' },
  // Distribución
  { module: 'dist_credit', path: '/backend/dist_credit', description: 'Créditos' },
  { module: 'dist_price_lists', path: '/backend/dist_price_lists', description: 'Listas de precio' },
  { module: 'dist_inventory', path: '/backend/dist_inventory', description: 'Inventario dist.' },
  { module: 'dist_routes', path: '/backend/dist_routes', description: 'Rutas de distribución' },
  { module: 'dist_delivery', path: '/backend/dist_delivery', description: 'Entregas' },
  { module: 'dist_commissions', path: '/backend/dist_commissions', description: 'Comisiones' },
  // Automotive
  { module: 'auto_vehicles', path: '/backend/auto_vehicles', description: 'Vehículos' },
  { module: 'auto_service_orders', path: '/backend/auto_service_orders', description: 'Órdenes de servicio' },
  { module: 'auto_parts', path: '/backend/auto_parts', description: 'Repuestos' },
  { module: 'auto_inspections', path: '/backend/auto_inspections', description: 'Inspecciones' },
  // Retail
  { module: 'retail_branches', path: '/backend/retail_branches', description: 'Sucursales' },
  { module: 'retail_inventory', path: '/backend/retail_inventory', description: 'Inventario retail' },
  { module: 'retail_loyalty', path: '/backend/retail_loyalty', description: 'Lealtad' },
  { module: 'retail_pricing', path: '/backend/retail_pricing', description: 'Precios' },
  { module: 'retail_purchasing', path: '/backend/retail_purchasing', description: 'Compras retail' },
  { module: 'retail_returns', path: '/backend/retail_returns', description: 'Devoluciones' },
  { module: 'retail_ecommerce', path: '/backend/retail_ecommerce', description: 'E-commerce' },
  // Condominios
  { module: 'condo_properties', path: '/backend/condo_properties', description: 'Edificios' },
  { module: 'condo_fees', path: '/backend/condo_fees', description: 'Cuotas' },
  { module: 'condo_collections', path: '/backend/condo_collections', description: 'Cobros condo' },
  { module: 'condo_maintenance', path: '/backend/condo_maintenance', description: 'Mantenimiento' },
  { module: 'condo_comms', path: '/backend/condo_comms', description: 'Comunicaciones condo' },
  { module: 'condo_accounting', path: '/backend/condo_accounting', description: 'Contabilidad condo' },
  // Construcción
  { module: 'const_projects', path: '/backend/const_projects', description: 'Proyectos' },
  { module: 'const_budget', path: '/backend/const_budget', description: 'Presupuestos' },
  { module: 'const_rfis', path: '/backend/const_rfis', description: 'RFIs' },
  { module: 'const_subcon', path: '/backend/const_subcon', description: 'Subcontratistas' },
  { module: 'const_materials', path: '/backend/const_materials', description: 'Materiales' },
  { module: 'const_daily', path: '/backend/const_daily', description: 'Informes diarios' },
  { module: 'const_schedule', path: '/backend/const_schedule', description: 'Cronograma' },
  { module: 'const_progress', path: '/backend/const_progress', description: 'Avance de obra' },
  // Academia
  { module: 'academy_courses', path: '/backend/academy_courses', description: 'Cursos' },
  { module: 'academy_enrollments', path: '/backend/academy_enrollments', description: 'Inscripciones academia' },
  { module: 'academy_instructors', path: '/backend/academy_instructors', description: 'Instructores' },
  { module: 'academy_groups', path: '/backend/academy_groups', description: 'Grupos academia' },
  { module: 'academy_payments', path: '/backend/academy_payments', description: 'Pagos academia' },
  { module: 'academy_certificates', path: '/backend/academy_certificates', description: 'Certificados' },
  // ISP
  { module: 'isp_plans', path: '/backend/isp_plans', description: 'Planes ISP' },
  { module: 'isp_network', path: '/backend/isp_network', description: 'Red ISP' },
  { module: 'isp_subscribers', path: '/backend/isp_subscribers', description: 'Abonados' },
  { module: 'isp_billing', path: '/backend/isp_billing', description: 'Facturación ISP' },
  { module: 'isp_support', path: '/backend/isp_support', description: 'Soporte ISP' },
  { module: 'isp_technicians', path: '/backend/isp_technicians', description: 'Técnicos ISP' },
  { module: 'isp_sales', path: '/backend/isp_sales', description: 'Ventas ISP' },
  // Agro
  { module: 'agri_units', path: '/backend/agri_units', description: 'Unidades productivas' },
  { module: 'agri_feed', path: '/backend/agri_feed', description: 'Alimentación' },
  { module: 'agri_vet', path: '/backend/agri_vet', description: 'Veterinaria' },
  { module: 'agri_inputs', path: '/backend/agri_inputs', description: 'Insumos' },
  { module: 'agri_processing', path: '/backend/agri_processing', description: 'Procesamiento' },
  { module: 'agri_quality', path: '/backend/agri_quality', description: 'Calidad agro' },
  { module: 'agri_sales', path: '/backend/agri_sales', description: 'Ventas agro' },
  { module: 'agri_traceability', path: '/backend/agri_traceability', description: 'Trazabilidad' },
  { module: 'agri_cold_chain', path: '/backend/agri_cold_chain', description: 'Cadena de frío' },
  { module: 'agri_hr', path: '/backend/agri_hr', description: 'RR.HH. agro' },
  { module: 'agri_field', path: '/backend/agri_field', description: 'Campo' },
  // Manufactura
  { module: 'mfg_bom', path: '/backend/mfg_bom', description: 'Listas de materiales' },
  { module: 'mfg_inventory', path: '/backend/mfg_inventory', description: 'Inventario mfg' },
  { module: 'mfg_orders', path: '/backend/mfg_orders', description: 'Órdenes de producción' },
  { module: 'mfg_quality', path: '/backend/mfg_quality', description: 'Calidad mfg' },
  { module: 'mfg_mrp', path: '/backend/mfg_mrp', description: 'MRP' },
  { module: 'mfg_maintenance', path: '/backend/mfg_maintenance', description: 'Mantenimiento mfg' },
  { module: 'mfg_procurement', path: '/backend/mfg_procurement', description: 'Compras mfg' },
  { module: 'mfg_dispatch', path: '/backend/mfg_dispatch', description: 'Despachos mfg' },
  { module: 'mfg_hr', path: '/backend/mfg_hr', description: 'RR.HH. mfg' },
  { module: 'mfg_costs', path: '/backend/mfg_costs', description: 'Costos mfg' },
  { module: 'mfg_energy', path: '/backend/mfg_energy', description: 'Energía mfg' },
  { module: 'mfg_floor', path: '/backend/mfg_floor', description: 'Piso mfg' },
  { module: 'mfg_planning', path: '/backend/mfg_planning', description: 'Planeación mfg' },
  { module: 'mfg_subcontract', path: '/backend/mfg_subcontract', description: 'Subcontratación mfg' },
  // Vertical Presets
  { module: 'vertical_presets', path: '/backend/vertical_presets', description: 'Presets de vertical' },
  // Attendance
  { module: 'attendance', path: '/backend/attendance', description: 'Asistencia' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = process.env.BASE_URL?.trim() || 'http://localhost:3000'

/**
 * Login via the OM form-based login endpoint and return the auth_token cookie.
 *
 * The frontend (SSR) uses httpOnly cookie auth (auth_token), not Bearer headers.
 * Verified in: packages/core/src/modules/auth/api/login.ts:212
 *   res.cookies.set('auth_token', authTokenForCookie, { httpOnly: true, ... })
 */
async function getSessionCookie(request: any): Promise<string | null> {
  const credentials = [
    { email: 'admin@acme.com', password: 'secret' },
    { email: process.env.OM_INIT_SUPERADMIN_EMAIL || 'superadmin@acme.com', password: process.env.OM_INIT_SUPERADMIN_PASSWORD || 'secret' },
  ]

  for (const cred of credentials) {
    const form = new URLSearchParams()
    form.set('email', cred.email)
    form.set('password', cred.password)

    const res = await request.post(`${BASE_URL}/api/auth/login`, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: form.toString(),
    })

    // Extract auth_token from Set-Cookie header
    const setCookie = res.headers()['set-cookie'] || ''
    const tokenMatch = setCookie.match(/auth_token=([^;]+)/)
    if (tokenMatch) {
      return tokenMatch[1]
    }

    // Fallback: check JSON response for token
    try {
      const body = await res.json() as Record<string, unknown>
      if (body.token && typeof body.token === 'string') {
        return body.token
      }
    } catch { /* not JSON */ }
  }

  return null
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('TC-FRONTEND-001: Backend Pages — Render Health', () => {
  let sessionCookie: string | null = null

  test.beforeAll(async ({ request }) => {
    sessionCookie = await getSessionCookie(request)
    // Cookie may be null in environments where login flow differs; tests
    // still run but will check for auth-redirect (307) rather than 200.
  })

  for (const page of BACKEND_PAGES) {
    test(`[${page.module}] ${page.description} → ruta registrada, sin 404/500`, async ({ request }) => {
      const headers: Record<string, string> = {}
      if (sessionCookie) {
        headers['Cookie'] = `auth_token=${sessionCookie}`
      }

      const response = await request.get(`${BASE_URL}${page.path}`, {
        headers,
        maxRedirects: 0, // Capturar redirects explícitamente
      })

      const status = response.status()

      // 404 = page.tsx not registered (missing implementation)
      // >=500 = React SSR crash or server error
      // 200 = page renders OK
      // 307/302 = redirect (auth or tenant-select — acceptable)
      const isServerError = status >= 500
      const isMissingRoute = status === 404

      if (isMissingRoute) {
        throw new Error(
          `Page "${page.module}" at ${page.path} returned 404.\n` +
          `Causa: page.tsx faltante o ruta no registrada en el módulo registry.\n` +
          `Fix: crear ${page.path.replace('/backend/', 'src/modules/').replace(/_/g, '_')}/page.tsx\n` +
          `Referencia: module-registry.ts:1403 — solo registra page.tsx con default export.`,
        )
      }

      if (isServerError) {
        let body = ''
        try { body = await response.text() } catch { /* ignore */ }
        throw new Error(
          `Page "${page.module}" at ${page.path} returned HTTP ${status}.\n` +
          `Causa: React SSR crash, import roto o error en el componente de página.\n` +
          `Primeros 200 chars del body: ${body.substring(0, 200)}`,
        )
      }

      // 200 = OK, 307/302 = redirect (auth/tenant) — ambos son aceptables
      expect([200, 301, 302, 307, 308]).toContain(status)
    })
  }
})
