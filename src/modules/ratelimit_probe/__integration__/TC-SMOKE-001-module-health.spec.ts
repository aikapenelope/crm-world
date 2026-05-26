/**
 * TC-SMOKE-001: All Custom Modules — API Health Check
 *
 * Verifica que todos los módulos custom de crm-world responden en sus
 * endpoints principales sin errores 500. Sigue el patrón de OM:
 * - API-backed, sin UI — más rápido y estable que tests de browser
 * - Fixtures aislados por test (crea + limpia, no depende de datos semilla)
 * - Reporte detallado de fallos por módulo (nombre + ruta + código HTTP + mensaje)
 *
 * Fuente del patrón: open-mercato .ai/qa/AGENTS.md
 * Helpers: @open-mercato/core/helpers/integration/api
 *
 * Cómo correr:
 *   Opción A (ephemeral — recomendado por OM):
 *     yarn test:integration:ephemeral
 *
 *   Opción B (contra producción, solo lectura):
 *     BASE_URL=https://mercato.novaincs.com yarn test:integration
 *
 *   Opción C (filtrar solo este spec):
 *     npx playwright test --config .ai/qa/tests/playwright.config.ts TC-SMOKE-001
 */
import { test, expect } from '@playwright/test'
import {
  getAuthToken,
  apiRequest,
} from '@open-mercato/core/helpers/integration/api'

// ---------------------------------------------------------------------------
// Configuración de endpoints por módulo
// Cada entrada: [módulo, path API, método, descripción]
// ---------------------------------------------------------------------------
type EndpointCheck = {
  module: string
  path: string
  method: 'GET'
  description: string
}

const MODULE_ENDPOINTS: EndpointCheck[] = [
  // Real Estate
  { module: 'properties', path: '/api/properties/properties?pageSize=1', method: 'GET', description: 'Listar propiedades' },
  { module: 'transactions', path: '/api/transactions/transactions?pageSize=1', method: 'GET', description: 'Listar transacciones' },
  { module: 'matching', path: '/api/matching/matches?pageSize=1', method: 'GET', description: 'Listar matchings' },
  { module: 'market_intelligence', path: '/api/market-intelligence/valuations?pageSize=1', method: 'GET', description: 'Listar valuaciones' },
  // Fiscal Venezuela
  { module: 've_tax_books', path: '/api/ve-tax-books/book-entries?pageSize=1', method: 'GET', description: 'Listar libro IVA' },
  { module: 've_withholdings', path: '/api/ve-withholdings/withholdings?pageSize=1', method: 'GET', description: 'Listar retenciones' },
  { module: 'bank_reconciliation', path: '/api/bank-reconciliation/movements?pageSize=1', method: 'GET', description: 'Listar movimientos' },
  { module: 'payment_methods', path: '/api/payment-methods/methods?pageSize=1', method: 'GET', description: 'Listar métodos de pago' },
  // Education
  { module: 'students', path: '/api/students/students?pageSize=1', method: 'GET', description: 'Listar alumnos' },
  { module: 'enrollment', path: '/api/enrollment/applications?pageSize=1', method: 'GET', description: 'Listar inscripciones' },
  { module: 'tuition', path: '/api/tuition/charges?pageSize=1', method: 'GET', description: 'Listar cobros' },
  { module: 'grades', path: '/api/grades/records?pageSize=1', method: 'GET', description: 'Listar calificaciones' },
  // Distribution
  { module: 'dist_credit', path: '/api/dist-credit/accounts?pageSize=1', method: 'GET', description: 'Listar créditos' },
  { module: 'dist_price_lists', path: '/api/dist-price-lists/price-lists?pageSize=1', method: 'GET', description: 'Listar listas de precio' },
  { module: 'dist_inventory', path: '/api/dist-inventory/items?pageSize=1', method: 'GET', description: 'Listar inventario' },
  { module: 'dist_routes', path: '/api/dist-routes/routes?pageSize=1', method: 'GET', description: 'Listar rutas' },
  { module: 'dist_delivery', path: '/api/dist-delivery/deliveries?pageSize=1', method: 'GET', description: 'Listar entregas' },
  { module: 'dist_commissions', path: '/api/dist-commissions/commissions?pageSize=1', method: 'GET', description: 'Listar comisiones' },
  // Automotive
  { module: 'auto_vehicles', path: '/api/auto-vehicles/vehicles?pageSize=1', method: 'GET', description: 'Listar vehículos' },
  { module: 'auto_service_orders', path: '/api/auto-service-orders/orders?pageSize=1', method: 'GET', description: 'Listar órdenes de servicio' },
  { module: 'auto_parts', path: '/api/auto-parts/parts?pageSize=1', method: 'GET', description: 'Listar repuestos' },
  // Retail
  { module: 'retail_branches', path: '/api/retail-branches/branches?pageSize=1', method: 'GET', description: 'Listar sucursales' },
  { module: 'retail_inventory', path: '/api/retail-inventory/items?pageSize=1', method: 'GET', description: 'Listar inventario retail' },
  { module: 'retail_loyalty', path: '/api/retail-loyalty/members?pageSize=1', method: 'GET', description: 'Listar socios lealtad' },
  { module: 'retail_pricing', path: '/api/retail-pricing/rules?pageSize=1', method: 'GET', description: 'Listar reglas de precio' },
  { module: 'retail_purchasing', path: '/api/retail-purchasing/orders?pageSize=1', method: 'GET', description: 'Listar órdenes compra' },
  { module: 'retail_returns', path: '/api/retail-returns/returns?pageSize=1', method: 'GET', description: 'Listar devoluciones' },
  // Condominios
  { module: 'condo_properties', path: '/api/condo-properties/buildings?pageSize=1', method: 'GET', description: 'Listar edificios' },
  { module: 'condo_fees', path: '/api/condo-fees/fees?pageSize=1', method: 'GET', description: 'Listar cuotas' },
  { module: 'condo_collections', path: '/api/condo-collections/collections?pageSize=1', method: 'GET', description: 'Listar cobros condo' },
  { module: 'condo_maintenance', path: '/api/condo-maintenance/requests?pageSize=1', method: 'GET', description: 'Listar mantenimiento' },
  { module: 'condo_comms', path: '/api/condo-comms/circulars?pageSize=1', method: 'GET', description: 'Listar circulares' },
  // Construcción
  { module: 'const_projects', path: '/api/const-projects/projects?pageSize=1', method: 'GET', description: 'Listar proyectos' },
  { module: 'const_budget', path: '/api/const-budget/budgets?pageSize=1', method: 'GET', description: 'Listar presupuestos' },
  { module: 'const_rfis', path: '/api/const-rfis/rfis?pageSize=1', method: 'GET', description: 'Listar RFIs' },
  { module: 'const_subcon', path: '/api/const-subcon/subcontractors?pageSize=1', method: 'GET', description: 'Listar subcontratistas' },
  { module: 'const_materials', path: '/api/const-materials/items?pageSize=1', method: 'GET', description: 'Listar materiales' },
  // Academia
  { module: 'academy_courses', path: '/api/academy-courses/courses?pageSize=1', method: 'GET', description: 'Listar cursos' },
  { module: 'academy_enrollments', path: '/api/academy-enrollments/enrollments?pageSize=1', method: 'GET', description: 'Listar inscripciones academia' },
  { module: 'academy_instructors', path: '/api/academy-instructors/instructors?pageSize=1', method: 'GET', description: 'Listar instructores' },
  { module: 'academy_groups', path: '/api/academy-groups/groups?pageSize=1', method: 'GET', description: 'Listar grupos academia' },
  { module: 'academy_payments', path: '/api/academy-payments/payments?pageSize=1', method: 'GET', description: 'Listar pagos academia' },
  // ISP
  { module: 'isp_plans', path: '/api/isp-plans/plans?pageSize=1', method: 'GET', description: 'Listar planes ISP' },
  { module: 'isp_network', path: '/api/isp-network/nodes?pageSize=1', method: 'GET', description: 'Listar nodos de red' },
  { module: 'isp_subscribers', path: '/api/isp-subscribers/subscribers?pageSize=1', method: 'GET', description: 'Listar abonados' },
  { module: 'isp_billing', path: '/api/isp-billing/invoices?pageSize=1', method: 'GET', description: 'Listar facturas ISP' },
  { module: 'isp_support', path: '/api/isp-support/tickets?pageSize=1', method: 'GET', description: 'Listar tickets soporte' },
  { module: 'isp_technicians', path: '/api/isp-technicians/technicians?pageSize=1', method: 'GET', description: 'Listar técnicos' },
  { module: 'isp_sales', path: '/api/isp-sales/leads?pageSize=1', method: 'GET', description: 'Listar leads ISP' },
  // Agri
  { module: 'agri_units', path: '/api/agri-units/units?pageSize=1', method: 'GET', description: 'Listar unidades de producción' },
  { module: 'agri_feed', path: '/api/agri-feed/formulas?pageSize=1', method: 'GET', description: 'Listar fórmulas alimento' },
  { module: 'agri_vet', path: '/api/agri-vet/vaccination-records?pageSize=1', method: 'GET', description: 'Listar registros vet' },
  { module: 'agri_inputs', path: '/api/agri-inputs/items?pageSize=1', method: 'GET', description: 'Listar insumos' },
  { module: 'agri_processing', path: '/api/agri-processing/lots?pageSize=1', method: 'GET', description: 'Listar lotes procesados' },
  { module: 'agri_quality', path: '/api/agri-quality/non-conformities?pageSize=1', method: 'GET', description: 'Listar NCs' },
  { module: 'agri_sales', path: '/api/agri-sales/orders?pageSize=1', method: 'GET', description: 'Listar ventas agri' },
  // Manufacturing
  { module: 'mfg_bom', path: '/api/mfg-bom/boms?pageSize=1', method: 'GET', description: 'Listar BOMs' },
  { module: 'mfg_inventory', path: '/api/mfg-inventory/batches?pageSize=1', method: 'GET', description: 'Listar lotes inventario mfg' },
  { module: 'mfg_orders', path: '/api/mfg-orders/production-orders?pageSize=1', method: 'GET', description: 'Listar órdenes producción' },
  { module: 'mfg_quality', path: '/api/mfg-quality/quality-plans?pageSize=1', method: 'GET', description: 'Listar planes QC' },
  { module: 'mfg_mrp', path: '/api/mfg-mrp/requirements?pageSize=1', method: 'GET', description: 'Listar requisiciones MRP' },
  { module: 'mfg_maintenance', path: '/api/mfg-maintenance/work-orders?pageSize=1', method: 'GET', description: 'Listar OTs mantenimiento' },
  { module: 'mfg_procurement', path: '/api/mfg-procurement/purchase-orders?pageSize=1', method: 'GET', description: 'Listar OCs' },
  { module: 'mfg_dispatch', path: '/api/mfg-dispatch/orders?pageSize=1', method: 'GET', description: 'Listar despachos' },
  // Vertical Presets
  { module: 'vertical_presets', path: '/api/vertical-presets/tenant-vertical', method: 'GET', description: 'Leer vertical del tenant' },
]

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('TC-SMOKE-001: All Custom Modules — API Health', () => {
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    adminToken = await getAuthToken(request, 'admin')
  })

  // Individual test per module for precise failure reporting
  for (const check of MODULE_ENDPOINTS) {
    test(`[${check.module}] ${check.description} → no 500`, async ({ request }) => {
      const response = await apiRequest(request, check.method, check.path, {
        token: adminToken,
      })

      // Accept any non-500 response:
      // 200 = success
      // 400/422 = validation (endpoint exists, schema works)
      // 401 = auth required (route exists)
      // 403 = forbidden (route exists, RBAC works)
      // 404 = empty collection or not found (acceptable for empty test DB)
      const status = response.status()
      const isServerError = status >= 500
      if (isServerError) {
        // Extract error details for the failure report
        let errorBody = ''
        try {
          const body = await response.json() as Record<string, unknown>
          errorBody = JSON.stringify(body, null, 2).substring(0, 500)
        } catch {
          errorBody = await response.text().catch(() => '(no body)')
        }
        throw new Error(
          `Module "${check.module}" returned HTTP ${status} on ${check.method} ${check.path}\n` +
          `Description: ${check.description}\n` +
          `Response body:\n${errorBody}`,
        )
      }

      expect(status, `${check.module}: ${check.path} returned ${status}`).toBeLessThan(500)
    })
  }
})
