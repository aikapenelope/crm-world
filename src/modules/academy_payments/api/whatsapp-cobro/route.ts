/**
 * WhatsApp cobro — pending payments with wa.me links for collection.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_payments.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // Get all active enrollments with remaining balance
  const enrollments = await kysely
    .selectFrom('academy_enrollments')
    .select(['id', 'student_name', 'student_phone', 'price_agreed', 'currency', 'group_id', 'enrollment_number'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('status', 'in', ['active', 'pending_payment'])
    .where('deleted_at', 'is', null)
    .execute()

  const result = []

  for (const enrollment of enrollments as any[]) {
    // Sum confirmed payments
    const payments = await kysely
      .selectFrom('academy_payments')
      .select(['amount'])
      .where('enrollment_id', '=', enrollment.id)
      .where('status', '=', 'confirmed')
      .execute()

    const paidTotal = (payments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
    const remaining = Math.max(0, Number(enrollment.price_agreed) - paidTotal)

    if (remaining <= 0) continue

    // Get group code
    const group = await kysely
      .selectFrom('academy_groups')
      .select(['group_code'])
      .where('id', '=', enrollment.group_id)
      .executeTakeFirst()

    const phone = (enrollment.student_phone ?? '').replace(/\D/g, '')
    const message = encodeURIComponent(
      `Hola ${enrollment.student_name}, tienes un saldo pendiente de $${remaining.toFixed(2)} USD para el grupo ${(group as any)?.group_code ?? enrollment.group_id}. Por favor confirmar tu pago.`
    )
    const waLink = phone ? `https://wa.me/${phone}?text=${message}` : null

    result.push({
      enrollment_id: enrollment.id,
      enrollment_number: enrollment.enrollment_number,
      student_name: enrollment.student_name,
      student_phone: enrollment.student_phone,
      group_code: (group as any)?.group_code ?? '',
      price_agreed: enrollment.price_agreed,
      paid_total: paidTotal.toFixed(2),
      remaining: remaining.toFixed(2),
      currency: enrollment.currency,
      wa_link: waLink,
    })
  }

  return Response.json({ items: result, count: result.length })
}

export const openApi = {}
