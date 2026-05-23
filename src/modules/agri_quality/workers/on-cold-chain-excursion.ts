/**
 * agri_quality — On Cold Chain Excursion Subscriber
 *
 * Triggered by: agri_cold_chain.temperature.excursion
 *
 * When the cold chain worker detects a sustained temperature excursion
 * (beyond min_alert_minutes threshold), this subscriber automatically creates
 * a NonConformity record in agri_quality with source = 'temperature_excursion'.
 *
 * The NC is linked back to the cold storage unit and any active storage lot
 * records affected by the excursion. The quality manager then reviews and
 * decides: keep product, destroy, or hold for analysis (workflow).
 *
 * Cross-module: reads agri_cold_storage_units, agri_storage_lot_records,
 * agri_temperature_logs via Kysely.
 */
import { AgriNonConformityEntity } from '../data/entities'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  event: 'agri_cold_chain.temperature.excursion',
  persistent: true,
  id: 'agri_quality.on-cold-chain-excursion',
}

export default async function handler(payload: any, ctx: any) {
  const em     = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  const tenantId       = payload.tenantId
  const organizationId = payload.organizationId
  const unitId         = payload.unit_id
  const unitName       = payload.unit_name ?? 'Cuarto frío'
  const tempC          = payload.temperature_c
  const targetMin      = payload.target_min
  const targetMax      = payload.target_max
  const direction      = payload.direction === 'above_max' ? 'por encima del máximo' : 'por debajo del mínimo'
  const durationMin    = payload.duration_minutes ?? 15

  if (!unitId || !tenantId) {
    console.log('[agri_quality.on-cold-chain-excursion] Missing unit_id or tenantId — skipping')
    return { skipped: true }
  }

  // Auto-generate NC number: NC-YYYYMM-{seq}
  const ym = new Date().toISOString().slice(0, 7).replace('-', '')
  const existingNcs = await kysely
    .selectFrom('agri_non_conformities')
    .select(['id'])
    .where('tenant_id', '=', tenantId)
    .where('nc_number', 'like', `NC-${ym}-%`)
    .execute()
  const seq      = (existingNcs as any[]).length + 1
  const ncNumber = `NC-${ym}-${String(seq).padStart(3, '0')}`

  const description = [
    `Excursión de temperatura detectada en ${unitName}.`,
    `Temperatura registrada: ${tempC}°C (${direction}).`,
    `Rango aceptable: ${targetMin}°C — ${targetMax}°C.`,
    `Duración confirmada: ≥ ${durationMin} minutos continuos.`,
    'Revisar los lotes almacenados y decidir disposición.',
  ].join(' ')

  // Create the NC
  const nc = em.create(AgriNonConformityEntity, {
    tenant_id:        tenantId,
    organization_id:  organizationId,
    nc_number:        ncNumber,
    source:           'temperature_excursion',
    severity:         'critical',
    description,
    detection_date:   new Date(),
    status:           'open',
    notes: `Cold storage unit ID: ${unitId}. Payload: temp=${tempC}°C, duration≥${durationMin}min`,
  } as any)

  em.persist(nc)
  await em.flush()

  // Update any storage lot records in this unit that have non_conformity_id = 'pending'
  await kysely
    .updateTable('agri_storage_lot_records')
    .set({ non_conformity_id: nc.id, updated_at: new Date() })
    .where('cold_storage_unit_id', '=', unitId)
    .where('tenant_id', '=', tenantId)
    .where('non_conformity_id', '=', 'pending')
    .execute()

  await emitLifecycle(eventsConfig, 'agri_quality.nc.created', { tenantId, organizationId }, {
    nc_id:      nc.id,
    nc_number:  ncNumber,
    source:     'temperature_excursion',
    unit_name:  unitName,
    severity:   'critical',
  })

  console.log(
    `[agri_quality.on-cold-chain-excursion] NC ${ncNumber} created` +
    ` for unit ${unitName} (${tempC}°C, ${direction})`,
  )

  return { created: true, nc_id: nc.id, nc_number: ncNumber }
}
