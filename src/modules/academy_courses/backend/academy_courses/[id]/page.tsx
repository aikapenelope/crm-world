'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { updateCrud, deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, BookOpen, Users, Clock, DollarSign, Edit2, Archive } from 'lucide-react'

type Course = {
  id: string
  name: string
  description: string | null
  category: string
  level: string
  duration_hours: string
  price_usd: string
  currency: string
  modality: string
  max_students: number
  prerequisites: string | null
  is_active: boolean
  created_at: string
}

type Group = {
  id: string
  group_code: string
  start_date: string
  end_date: string
  status: string
  enrolled_count: number
  max_students: number
  instructor_name: string | null
}

const MODALITY_LABELS: Record<string, string> = {
  in_person: 'Presencial', online: 'Online', hybrid: 'Híbrida',
}

const GROUP_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado', in_progress: 'En curso',
  completed: 'Completado', cancelled: 'Cancelado',
}

export default function AcademyCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string

  const [course, setCourse] = React.useState<Course | null>(null)
  const [groups, setGroups] = React.useState<Group[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [editing, setEditing] = React.useState(false)
  const [editName, setEditName] = React.useState('')
  const [editPrice, setEditPrice] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  async function load() {
    setIsLoading(true)
    const [courseRes, groupsRes] = await Promise.all([
      apiCall<{ items: Course[] }>(
        `/api/academy-courses/courses?id=${courseId}`,
        undefined,
        { fallback: { items: [] } },
      ),
      apiCall<{ items: Group[] }>(
        `/api/academy-groups/groups?course_id=${courseId}&pageSize=50`,
        undefined,
        { fallback: { items: [] } },
      ),
    ])
    const c = courseRes.result?.items?.[0] ?? null
    setCourse(c)
    if (c) { setEditName(c.name); setEditPrice(c.price_usd) }
    setGroups(groupsRes.result?.items ?? [])
    setIsLoading(false)
  }

  React.useEffect(() => { if (courseId) load() }, [courseId])

  async function handleSave() {
    if (!course) return
    setSaving(true)
    const res = await updateCrud('academy-courses/courses', {
      id: course.id, name: editName, price_usd: editPrice,
    })
    if (res.ok) {
      flash('Curso actualizado', 'success')
      setEditing(false)
      await load()
    } else {
      flash('Error al actualizar', 'error')
    }
    setSaving(false)
  }

  async function handleToggleActive() {
    if (!course) return
    const res = await updateCrud('academy-courses/courses', {
      id: course.id, is_active: !course.is_active,
    })
    if (res.ok) { flash(course.is_active ? 'Curso archivado' : 'Curso activado', 'success'); await load() }
  }

  if (isLoading) return <LoadingMessage label="Cargando curso..." />
  if (!course) return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver
        </Button>
        <p className="mt-4 text-muted-foreground">Curso no encontrado.</p>
      </PageBody>
    </Page>
  )

  const activeGroups = groups.filter(g => g.status === 'in_progress').length
  const totalEnrolled = groups.reduce((s, g) => s + g.enrolled_count, 0)

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cursos
        </Button>

        {/* Header */}
        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            {editing ? (
              <input
                className="text-2xl font-bold border rounded px-2 py-1 w-80"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            ) : (
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="size-6 text-muted-foreground" />
                {course.name}
              </h1>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline">{course.category}</Badge>
              <Badge variant="secondary">{course.level}</Badge>
              <Badge variant="outline">{MODALITY_LABELS[course.modality] ?? course.modality}</Badge>
              {!course.is_active && <Badge variant="secondary">Inactivo</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="mr-2 size-4" />Editar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleToggleActive}>
                  <Archive className="mr-2 size-4" />
                  {course.is_active ? 'Archivar' : 'Activar'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push(`/backend/academy_groups/create?course_id=${course.id}`)}
                >
                  <Users className="mr-2 size-4" />
                  Nuevo grupo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <Clock className="size-3" /> Duración
            </div>
            <div className="font-bold">{Number(course.duration_hours).toFixed(0)} horas</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <DollarSign className="size-3" /> Precio
            </div>
            {editing ? (
              <input
                type="number"
                className="w-full text-center font-bold border rounded px-1 text-sm"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
              />
            ) : (
              <div className="font-bold">USD {Number(course.price_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            )}
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Grupos activos</div>
            <div className="font-bold text-primary">{activeGroups}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Inscritos totales</div>
            <div className="font-bold">{totalEnrolled}</div>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <div className="rounded-lg border p-4 mb-6">
            <h3 className="text-sm font-semibold mb-2">Descripción</h3>
            <p className="text-sm text-muted-foreground">{course.description}</p>
            {course.prerequisites && (
              <p className="text-sm mt-2">
                <span className="font-medium">Prerequisitos:</span>{' '}
                <span className="text-muted-foreground">{course.prerequisites}</span>
              </p>
            )}
          </div>
        )}

        {/* Groups */}
        <h2 className="text-sm font-semibold mb-3">Grupos ({groups.length})</h2>
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
            No hay grupos creados para este curso.{' '}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => router.push(`/backend/academy_groups/create?course_id=${course.id}`)}
            >
              Crear el primero
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden divide-y">
            {groups.map(g => (
              <div
                key={g.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/backend/academy_groups/${g.id}`)}
              >
                <div>
                  <div className="font-medium text-sm">{g.group_code}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(g.start_date).toLocaleDateString('es-VE')} →{' '}
                    {new Date(g.end_date).toLocaleDateString('es-VE')}
                    {g.instructor_name && ` · ${g.instructor_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm text-muted-foreground">
                    {g.enrolled_count}/{g.max_students}
                  </span>
                  <Badge variant={g.status === 'in_progress' ? 'default' : 'outline'} className="text-xs">
                    {GROUP_STATUS_LABELS[g.status] ?? g.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
