import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pend. pago', active: 'Activo',
  completed: 'Completado', withdrawn: 'Retirado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'academy_enrollments.academy_enrollment',
      enabled: true,
      priority: 30,

      fieldPolicy: {
        searchable: ['enrollment_number', 'student_name', 'status'],
        hashOnly: ['student_email', 'student_phone'],
        excluded: ['price_agreed'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.student_name) lines.push(`Alumno: ${r.student_name}`)
        if (r.enrollment_number) lines.push(`Inscripción: ${r.enrollment_number}`)
        if (r.status) lines.push(`Estado: ${STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (!lines.length) return null

        // Load group + course name for richer context
        let groupInfo: string | null = null
        if (r.group_id) {
          try {
            const em = (ctx as any).resolve?.('em')
            if (em) {
              const kysely = (em as any).getKysely?.()
              if (kysely) {
                const group = await kysely.selectFrom('academy_groups').select(['group_code', 'course_id']).where('id', '=', r.group_id).executeTakeFirst()
                if (group) {
                  const course = await kysely.selectFrom('academy_courses').select(['name']).where('id', '=', (group as any).course_id).executeTakeFirst()
                  groupInfo = [(group as any).group_code, (course as any)?.name].filter(Boolean).join(' — ')
                  if (groupInfo) lines.push(`Grupo: ${groupInfo}`)
                }
              }
            }
          } catch { /* best-effort */ }
        }

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: lines,
          presenter: {
            title: (norm(r.student_name) ?? undefined) ?? 'Alumno',
            subtitle: [groupInfo, statusLabel].filter(Boolean).join(' · ') || undefined,
            icon: 'user-check',
            badge: statusLabel,
          },
          links: [{ href: `/backend/academy_enrollments/${r.id}`, label: 'Ver inscripción', kind: 'primary' }],
          checksumSource: { student_name: r.student_name, status: r.status, group_id: r.group_id, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.student_name) ?? undefined) ?? 'Alumno',
          subtitle: (norm(r.enrollment_number) ?? undefined) ?? undefined,
          icon: 'user-check',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        return id ? `/backend/academy_enrollments/${encodeURIComponent(String(id))}` : '/backend/academy_enrollments'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
