import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/postgresql'

/**
 * POST /api/tuition/charges/generate
 *
 * Generates monthly charges for all active students based on their tuition plan.
 * Applies active discounts (sibling, scholarship, etc.) automatically.
 *
 * Body: { period_month: "2026-10", plan_id?: string }
 */

const generateSchema = z.object({
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato debe ser YYYY-MM'),
  plan_id: z.string().uuid().optional(),
})

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['tuition.generate_charges'] },
}

export async function POST(request: Request, ctx: any) {
  try {
    const body = await request.json()
    const input = generateSchema.parse(body)

    const em: EntityManager = ctx.container.resolve('em')
    const scope = ctx.scope as { tenantId: string; organizationId: string }
    const kysely = (em as any).getKysely()

    // 1. Get active plans
    let plansQuery = kysely
      .selectFrom('tuition_plans')
      .selectAll()
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)

    if (input.plan_id) {
      plansQuery = plansQuery.where('id', '=', input.plan_id)
    }

    const plans = await plansQuery.execute()

    if (plans.length === 0) {
      return NextResponse.json({ generated: 0, skipped: 0, errors: ['No hay planes activos'], summary: 'No hay planes activos' })
    }

    // 2. Get all active students
    const students = await kysely
      .selectFrom('students')
      .select(['id', 'grade_level', 'enrollment_status'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('enrollment_status', '=', 'active')
      .where('deleted_at', 'is', null)
      .execute()

    // 3. Get existing charges for this month (to avoid duplicates)
    const existingCharges = await kysely
      .selectFrom('tuition_charges')
      .select(['student_id'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('period_month', '=', input.period_month)
      .where('concept', '=', 'mensualidad')
      .where('deleted_at', 'is', null)
      .execute()

    const alreadyCharged = new Set(existingCharges.map((c: any) => c.student_id))

    // 4. Get active discounts
    const discounts = await kysely
      .selectFrom('tuition_discounts')
      .selectAll()
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .execute()

    const discountsByStudent = new Map<string, any[]>()
    for (const d of discounts) {
      const list = discountsByStudent.get(d.student_id) ?? []
      list.push(d)
      discountsByStudent.set(d.student_id, list)
    }

    // 5. Generate charges
    const { TuitionChargeEntity } = await import('../../../data/entities')

    let generated = 0
    let skipped = 0
    const now = new Date()
    const [yearStr, monthStr] = input.period_month.split('-')
    const year = parseInt(yearStr)
    const month = parseInt(monthStr)

    for (const student of students) {
      if (alreadyCharged.has(student.id)) { skipped++; continue }

      const plan = plans.find((p: any) => !p.grade_level || p.grade_level === student.grade_level)
      if (!plan) { skipped++; continue }

      // Calculate amount with discounts
      let amount = parseFloat(plan.monthly_amount)
      const studentDiscounts = discountsByStudent.get(student.id) ?? []
      for (const discount of studentDiscounts) {
        if (discount.valid_from && new Date(discount.valid_from) > now) continue
        if (discount.valid_until && new Date(discount.valid_until) < now) continue
        if (discount.percentage) amount -= amount * (parseFloat(discount.percentage) / 100)
        else if (discount.fixed_amount) amount -= parseFloat(discount.fixed_amount)
      }
      amount = Math.max(0, Math.round(amount * 100) / 100)

      const dueDay = Math.min(plan.due_day, 28)
      const dueDate = new Date(year, month - 1, dueDay)

      em.persist(em.create(TuitionChargeEntity, {
        tenant_id: scope.tenantId,
        organization_id: scope.organizationId,
        student_id: student.id,
        plan_id: plan.id,
        period_month: input.period_month,
        concept: 'mensualidad',
        description: `Mensualidad ${input.period_month}`,
        amount: String(amount),
        currency: plan.currency ?? 'USD',
        status: 'pending',
        due_date: dueDate,
        late_fee_applied: '0.00',
        amount_paid: '0.00',
        created_at: now,
        updated_at: now,
      } as any))
      generated++
    }

    await em.flush()

    return NextResponse.json({
      generated,
      skipped,
      errors: [],
      summary: `Generados ${generated} cargos para ${input.period_month}. ${skipped} omitidos.`,
    })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const openApi = {}
