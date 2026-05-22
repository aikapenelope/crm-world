'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Search, DollarSign, Receipt, CheckCircle2 } from 'lucide-react'

/**
 * Collection Day Mode
 *
 * Simplified view optimized for speed when representatives come to pay.
 * Flow: Search student → See debt → Register payment → Receipt → Next
 */

type StudentResult = {
  id: string
  first_name: string
  last_name: string
  grade_level: string
  section: string
}

type ChargeResult = {
  id: string
  period_month: string
  amount: string
  currency: string
  status: string
  concept: string
}

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal', preescolar_1: 'Pre I', preescolar_2: 'Pre II',
  preescolar_3: 'Pre III', primaria_1: '1°', primaria_2: '2°',
  primaria_3: '3°', primaria_4: '4°', primaria_5: '5°',
  primaria_6: '6°', bachillerato_1: '1er Año', bachillerato_2: '2do Año',
  bachillerato_3: '3er Año', bachillerato_4: '4to Año', bachillerato_5: '5to Año',
}

export default function CollectionDayPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [students, setStudents] = React.useState<StudentResult[]>([])
  const [selectedStudent, setSelectedStudent] = React.useState<StudentResult | null>(null)
  const [charges, setCharges] = React.useState<ChargeResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLoadingCharges, setIsLoadingCharges] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Search students
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setSelectedStudent(null)
    setCharges([])

    const call = await apiCall<{ items: StudentResult[] }>(
      `/api/students/students?search=${encodeURIComponent(searchQuery)}&pageSize=10`,
      undefined,
      { fallback: { items: [] } },
    )
    if (call.ok) {
      setStudents(call.result?.items ?? [])
    }
    setIsSearching(false)
  }

  // Select student and load charges
  const handleSelectStudent = async (student: StudentResult) => {
    setSelectedStudent(student)
    setIsLoadingCharges(true)

    const call = await apiCall<{ items: ChargeResult[] }>(
      `/api/tuition/charges?student_id=${student.id}&status=pending,overdue&pageSize=20`,
      undefined,
      { fallback: { items: [] } },
    )
    if (call.ok) {
      setCharges(call.result?.items ?? [])
    }
    setIsLoadingCharges(false)
  }

  // Reset for next student
  const handleNext = () => {
    setSearchQuery('')
    setStudents([])
    setSelectedStudent(null)
    setCharges([])
    searchInputRef.current?.focus()
  }

  const totalDebt = charges.reduce((s, c) => s + Number(c.amount), 0)

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Día de Cobro</h1>
          <p className="text-muted-foreground mt-1">Modo rápido — buscar, cobrar, siguiente</p>
        </div>

        {/* Search Bar (large, centered) */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nombre o cédula del estudiante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                autoFocus
              />
            </div>
            <Button type="button" size="lg" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Spinner className="h-5 w-5" /> : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {students.length > 0 && !selectedStudent && (
          <div className="max-w-xl mx-auto space-y-2 mb-8">
            {students.map((s) => (
              <button
                key={s.id}
                className="w-full flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors text-left"
                onClick={() => handleSelectStudent(s)}
              >
                <div className="flex-1">
                  <span className="font-semibold text-lg">{s.first_name} {s.last_name}</span>
                </div>
                <Badge variant="outline">
                  {GRADE_LABELS[s.grade_level] ?? s.grade_level} - {s.section}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Selected Student + Charges */}
        {selectedStudent && (
          <div className="max-w-xl mx-auto">
            {/* Student Card */}
            <div className="rounded-lg border p-4 mb-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</div>
                  <Badge variant="outline" className="mt-1">
                    {GRADE_LABELS[selectedStudent.grade_level] ?? selectedStudent.grade_level} - Sección {selectedStudent.section}
                  </Badge>
                </div>
                {totalDebt > 0 ? (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Debe</div>
                    <div className="text-2xl font-bold text-destructive">USD {totalDebt.toLocaleString('es-VE')}</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Al día</span>
                  </div>
                )}
              </div>
            </div>

            {/* Charges */}
            {isLoadingCharges ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : charges.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-2" />
                <p className="text-lg font-medium">Sin deuda pendiente</p>
                <Button type="button" variant="outline" className="mt-4" onClick={handleNext}>
                  Buscar otro estudiante
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {charges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <span className="font-medium">{charge.period_month}</span>
                        <span className="text-muted-foreground ml-2">— {charge.concept === 'mensualidad' ? 'Mensualidad' : charge.concept}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={charge.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {charge.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                        </Badge>
                        <span className="font-bold">{charge.currency} {Number(charge.amount).toLocaleString('es-VE')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    size="lg"
                    onClick={() => router.push(`/backend/tuition/payments?student=${selectedStudent.id}`)}
                  >
                    <DollarSign className="mr-2 h-5 w-5" />
                    Registrar Pago
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={handleNext}>
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {students.length === 0 && !selectedStudent && !isSearching && searchQuery === '' && (
          <div className="text-center py-16 text-muted-foreground">
            <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Escriba el nombre o cédula del estudiante para comenzar</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
