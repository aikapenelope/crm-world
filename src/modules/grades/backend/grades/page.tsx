'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { BookOpen, PenLine, FileText, Settings } from 'lucide-react'

type PeriodRow = { id: string; name: string; school_year: string; period_number: number; is_active: boolean }

export default function GradesMainPage() {
  const router = useRouter()
  const [periods, setPeriods] = React.useState<PeriodRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: PeriodRow[] }>(
        '/api/grades/periods?pageSize=10',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) setPeriods(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const activePeriod = periods.find((p) => p.is_active)

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notas</h1>
              <p className="text-sm text-muted-foreground">
                {activePeriod ? `Lapso activo: ${activePeriod.name} (${activePeriod.school_year})` : 'Sin lapso activo'}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => router.push('/backend/grades/subjects')}>
            <Settings className="mr-2 h-4 w-4" />
            Materias
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cargar Notas */}
            <button
              className="rounded-lg border p-6 text-left hover:bg-muted/30 transition-colors"
              onClick={() => router.push('/backend/grades/entry')}
            >
              <PenLine className="h-8 w-8 text-primary mb-3" />
              <h2 className="text-lg font-semibold mb-1">Cargar Notas</h2>
              <p className="text-sm text-muted-foreground">
                Registrar notas por sección y materia para el lapso activo
              </p>
            </button>

            {/* Boletines */}
            <button
              className="rounded-lg border p-6 text-left hover:bg-muted/30 transition-colors"
              onClick={() => router.push('/backend/grades/report-cards')}
            >
              <FileText className="h-8 w-8 text-primary mb-3" />
              <h2 className="text-lg font-semibold mb-1">Boletines</h2>
              <p className="text-sm text-muted-foreground">
                Generar y gestionar boletines por lapso
              </p>
            </button>

            {/* Lapsos */}
            <div className="rounded-lg border p-6">
              <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold mb-2">Lapsos</h2>
              <div className="space-y-2">
                {periods.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name}</span>
                    <Badge variant={p.is_active ? 'default' : 'outline'}>
                      {p.is_active ? 'Activo' : p.school_year}
                    </Badge>
                  </div>
                ))}
                {periods.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay lapsos configurados</p>
                )}
              </div>
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
