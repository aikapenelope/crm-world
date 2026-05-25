import { NextResponse } from 'next/server'
import type { EntityManager } from '@mikro-orm/postgresql'
import { TenantVerticalEntity } from '../../data/entities'
import { setVerticalSchema } from '../../data/validators'
import { getVertical, VERTICALS } from '../../data/verticals'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['vertical_presets.view'] },
  PUT: { requireAuth: true, requireFeatures: ['vertical_presets.manage'] },
}

/**
 * GET /api/vertical-presets/tenant-vertical
 * Retorna la vertical asignada al tenant del contexto actual.
 */
export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em') as EntityManager
  const auth = ctx.auth

  if (!auth?.tenantId) {
    return NextResponse.json({ ok: false, error: 'No tenant context' }, { status: 400 })
  }

  const record = await em.findOne(TenantVerticalEntity, {
    tenant_id: auth.tenantId,
    organization_id: auth.organizationId,
  } as any)

  const vertical = record ? getVertical(record.vertical_key) : null

  return NextResponse.json({
    ok: true,
    vertical_key: record?.vertical_key ?? null,
    vertical: vertical ?? null,
    set_at: record?.updated_at?.toISOString() ?? null,
  })
}

/**
 * PUT /api/vertical-presets/tenant-vertical
 * Asigna o actualiza la vertical para el tenant del contexto actual.
 * Solo superadmin debe tener el feature vertical_presets.manage.
 */
export async function PUT(request: Request, ctx: any) {
  const em = ctx.container.resolve('em') as EntityManager
  const auth = ctx.auth

  if (!auth?.tenantId) {
    return NextResponse.json({ ok: false, error: 'No tenant context' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = setVerticalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Vertical inválida', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { vertical_key } = parsed.data

  // Upsert: update existing or create new
  let record = await em.findOne(TenantVerticalEntity, {
    tenant_id: auth.tenantId,
    organization_id: auth.organizationId,
  } as any)

  if (record) {
    ;(record as any).vertical_key = vertical_key
    ;(record as any).set_by = auth.userId ?? null
    record.updated_at = new Date()
  } else {
    record = em.create(TenantVerticalEntity, {
      tenant_id: auth.tenantId,
      organization_id: auth.organizationId,
      vertical_key,
      set_by: auth.userId ?? null,
    } as any)
    em.persist(record)
  }

  await em.flush()

  const vertical = getVertical(vertical_key)
  return NextResponse.json({ ok: true, vertical_key, vertical: vertical ?? null })
}

export const openApi = {}
