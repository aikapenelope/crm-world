/**
 * GET /api/agri-traceability/trace?product_lot=PROD-2026-001
 *
 * Trazabilidad completa hacia atrás y hacia adelante desde un lote de
 * producto terminado. Recorre el grafo completo via Kysely:
 *
 * producto (lot_number)
 *   → agri_processing_lots
 *   → agri_slaughter_batches
 *   → agri_flocks (+ agri_farm_units)
 *   → agri_feed_allocations → agri_feed_batches
 *   → agri_vet_vaccination_records
 *   → agri_vet_medication_records
 *   → supplier (via agri_flocks.supplier_id)
 *
 * Todos los accesos son cross-module via Kysely (sin imports de entidades).
 * Este endpoint es la fuente de verdad para:
 *   - Respuesta ante recalls
 *   - Auditorías INSAI y de clientes corporativos
 *   - Certificados de trazabilidad para exportación
 */

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_traceability.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const url        = new URL(request.url)
  const lotNumber  = url.searchParams.get('product_lot')
  const lotId      = url.searchParams.get('lot_id')

  if (!lotNumber && !lotId) {
    return Response.json({ error: 'product_lot or lot_id is required' }, { status: 400 })
  }

  // ── 1. Producto terminado ─────────────────────────────────────────────────
  let lotQuery = kysely
    .selectFrom('agri_processing_lots')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)

  if (lotId)     lotQuery = lotQuery.where('id', '=', lotId)
  if (lotNumber) lotQuery = lotQuery.where('lot_number', '=', lotNumber)

  const lot = await lotQuery.executeTakeFirst()
  if (!lot) return Response.json({ error: 'Product lot not found' }, { status: 404 })

  const l = lot as any

  // ── 2. Fórmula de procesamiento ───────────────────────────────────────────
  const formula = await kysely
    .selectFrom('agri_processing_formulas')
    .select(['id', 'name', 'product_type', 'expected_yield_pct'])
    .where('id', '=', l.formula_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  // ── 3. Lote de beneficio ──────────────────────────────────────────────────
  const slaughterBatch = await kysely
    .selectFrom('agri_slaughter_batches')
    .selectAll()
    .where('id', '=', l.slaughter_batch_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  const sb = slaughterBatch as any

  // ── 4. Flock (lote de aves) ───────────────────────────────────────────────
  const flock = sb ? await kysely
    .selectFrom('agri_flocks')
    .selectAll()
    .where('id', '=', sb.flock_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst() : null

  const f = flock as any

  // ── 5. Granja/Galpón ──────────────────────────────────────────────────────
  const farmUnit = f ? await kysely
    .selectFrom('agri_farm_units')
    .select(['id', 'name', 'unit_type', 'location_address', 'ownership_type'])
    .where('id', '=', f.farm_unit_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst() : null

  // ── 6. Asignaciones de alimento al flock ──────────────────────────────────
  const feedAllocations = f ? await kysely
    .selectFrom('agri_feed_allocations')
    .select(['id', 'feed_batch_id', 'allocated_date', 'quantity_kg'])
    .where('flock_id', '=', f.id)
    .where('tenant_id', '=', scope.tenantId)
    .execute() : []

  const feedBatchIds = (feedAllocations as any[]).map((a: any) => a.feed_batch_id).filter(Boolean)
  const feedBatches = feedBatchIds.length > 0 ? await kysely
    .selectFrom('agri_feed_batches')
    .select(['id', 'batch_number', 'formula_id', 'batch_date', 'supplier_lot_number', 'source_type', 'status'])
    .where('id', 'in', feedBatchIds)
    .where('tenant_id', '=', scope.tenantId)
    .execute() : []

  // ── 7. Registros de vacunación del flock ──────────────────────────────────
  const vaccinationRecords = f ? await kysely
    .selectFrom('agri_vet_vaccination_records')
    .select(['id', 'vaccine_name', 'manufacturer', 'applied_date', 'vaccine_lot_number', 'vaccine_expiry_date', 'withdrawal_days', 'status'])
    .where('flock_id', '=', f.id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '=', 'applied')
    .execute() : []

  // ── 8. Registros de medicación del flock ──────────────────────────────────
  const medicationRecords = f ? await kysely
    .selectFrom('agri_vet_medication_records')
    .select(['id', 'medication_name', 'active_ingredient', 'treatment_start_date', 'treatment_end_date', 'withdrawal_days', 'withdrawal_end_date', 'medication_lot_number', 'resolved'])
    .where('flock_id', '=', f.id)
    .where('tenant_id', '=', scope.tenantId)
    .execute() : []

  // ── Verificación de período de retiro al momento del beneficio ─────────────
  const slaughterDate = sb ? String(sb.slaughter_date).split('T')[0] : null
  const activeWithdrawalsAtSlaughter = slaughterDate ? (medicationRecords as any[]).filter(
    (m: any) => m.withdrawal_end_date && String(m.withdrawal_end_date).split('T')[0] >= slaughterDate
  ) : []

  return Response.json({
    trace: {
      product_lot: {
        id:              l.id,
        lot_number:      l.lot_number,
        barcode:         l.barcode,
        processing_date: l.processing_date,
        quantity_kg:     l.quantity_kg,
        expiry_date:     l.expiry_date,
        status:          l.status,
        formula:         formula as any,
      },
      slaughter_batch: sb ? {
        id:                      sb.id,
        batch_number:            sb.batch_number,
        slaughter_date:          sb.slaughter_date,
        birds_processed:         sb.birds_processed,
        live_weight_kg:          sb.live_weight_kg,
        carcass_weight_cold_kg:  sb.carcass_weight_cold_kg,
        yield_pct:               sb.yield_pct,
        condemned_count:         sb.condemned_count,
        microbiological_result:  sb.microbiological_result,
        dispatch_approved_at:    sb.dispatch_approved_at,
      } : null,
      flock: f ? {
        id:                  f.id,
        flock_number:        f.flock_number,
        species:             f.species,
        genetic_line:        f.genetic_line,
        start_date:          f.start_date,
        initial_count:       f.initial_count,
        supplier_lot_number: f.supplier_lot_number,
        farm_unit:           farmUnit as any,
      } : null,
      feed: {
        allocations:  feedAllocations,
        batches:      feedBatches,
      },
      veterinary: {
        vaccinations:    vaccinationRecords,
        medications:     medicationRecords,
        withdrawal_check: {
          slaughter_date:              slaughterDate,
          active_withdrawals_at_slaughter: activeWithdrawalsAtSlaughter,
          compliant: activeWithdrawalsAtSlaughter.length === 0,
        },
      },
    },
    queried_at: new Date().toISOString(),
  })
}

export const openApi = {}
