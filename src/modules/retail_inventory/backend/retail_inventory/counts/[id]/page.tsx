'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ClipboardList } from 'lucide-react'

type Count = { id: string; count_number: string; status: string; count_type: string; branch_id: string; planned_date: string; notes: string | null }

const statusLabels: Record<string, string> = { planned: 'Planificado', in_progress: 'En Progreso', completed: 'Completado', cancelled: 'Cancelado' }

export default function CountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const countId = params.id as string
  const [count, setCount] = React.useState<Count | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ item: Count }>(`/api/retail-inventory/counts?id=${countId}`, undefined, { fallback: null as any })
      if (call.ok && call.result) setCount(call.result.item)
      setIsLoading(false)
    }
    load()
  }, [countId])

  async function startCount() {
    if (!count) return
    const call = await apiCall('/api/retail-inventory/counts', { method: 'PUT', body: JSON.stringify({ id: count.id, status: 'in_progress' }) })
    if (call.ok) { setCount({ ...count, status: 'in_progress' }); flash('Conteo iniciado', 'success') }
  }

  async function completeCount() {
    if (!count) return
    const call = await apiCall('/api/retail-inventory/counts', { method: 'PUT', body: JSON.stringify({ id: count.id, status: 'completed' }) })
    if (call.ok) { setCount({ ...count, status: 'completed' }); flash('Conteo completado', 'success') }
  }

  if (isLoading) return <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>
  if (!count) return <Page><PageBody><div className="text-center py-8 text-muted-foreground">No encontrado.</div></PageBody></Page>

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{count.count_number}</h1>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={count.status === 'completed' ? 'default' : 'secondary'}>{statusLabels[count.status]}</Badge>
                <span className="text-muted-foreground">Planificado: {new Date(count.planned_date).toLocaleDateString('es-VE')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {count.status === 'planned' && <Button type="button" onClick={startCount}>Iniciar Conteo</Button>}
            {count.status === 'in_progress' && <Button type="button" onClick={completeCount}>Completar</Button>}
            <Button type="button" variant="outline" onClick={() => router.back()}>Volver</Button>
          </div>
        </div>

        <div className="max-w-2xl rounded-lg border p-6">
          <p className="text-sm text-muted-foreground mb-4">
            {count.status === 'planned' && 'Este conteo está planificado. Presiona "Iniciar Conteo" cuando estés listo para comenzar.'}
            {count.status === 'in_progress' && 'Conteo en progreso. Registra las cantidades contadas y presiona "Completar" al terminar.'}
            {count.status === 'completed' && 'Este conteo ha sido completado. Los ajustes de inventario se aplicaron automáticamente.'}
          </p>
          {count.notes && <p className="text-sm border-t pt-3"><span className="font-medium">Notas:</span> {count.notes}</p>}
        </div>
      </PageBody>
    </Page>
  )
}
