'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Users, MessageCircle, AlertTriangle } from 'lucide-react'

/**
 * Siblings / Family View
 *
 * Groups students by representative (contact_id) and shows consolidated
 * debt per family. Useful for:
 * - Sending one WhatsApp message per family (not per student)
 * - Identifying families with multiple children who owe
 * - Applying sibling discounts
 */

type CobroItem = {
  chargeId: string
  studentId: string
  studentName: string
  gradeLabel: string
  section: string
  representativeName: string
  phone: string | null
  amount: string
  currency: string
  periodMonth: string
  status: string
  waLink: string | null
  message: string
}

type Family = {
  representativeName: string
  phone: string | null
  children: Array<{ studentName: string; gradeLabel: string; section: string; totalDebt: number }>
  totalDebt: number
  chargeCount: number
}

export default function SiblingsPage() {
  const [families, setFamilies] = React.useState<Family[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: CobroItem[] }>(
        '/api/tuition/whatsapp-cobro?status=pending,overdue',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        const items = call.result?.items ?? []
        // Group by representative
        const grouped = new Map<string, { rep: string; phone: string | null; items: CobroItem[] }>()
        for (const item of items) {
          const key = item.representativeName
          if (!grouped.has(key)) {
            grouped.set(key, { rep: item.representativeName, phone: item.phone, items: [] })
          }
          grouped.get(key)!.items.push(item)
        }

        // Build family summaries
        const familyList: Family[] = []
        for (const [, group] of grouped) {
          const childrenMap = new Map<string, { studentName: string; gradeLabel: string; section: string; totalDebt: number }>()
          for (const item of group.items) {
            if (!childrenMap.has(item.studentId)) {
              childrenMap.set(item.studentId, { studentName: item.studentName, gradeLabel: item.gradeLabel, section: item.section, totalDebt: 0 })
            }
            childrenMap.get(item.studentId)!.totalDebt += Number(item.amount)
          }

          familyList.push({
            representativeName: group.rep,
            phone: group.phone,
            children: Array.from(childrenMap.values()),
            totalDebt: group.items.reduce((s, i) => s + Number(i.amount), 0),
            chargeCount: group.items.length,
          })
        }

        // Sort by total debt descending
        familyList.sort((a, b) => b.totalDebt - a.totalDebt)
        setFamilies(familyList)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  // Build family WhatsApp message
  const buildFamilyMessage = (family: Family): string => {
    const childrenLines = family.children
      .map((c) => `  • ${c.studentName} (${c.gradeLabel} - ${c.section}): USD ${c.totalDebt.toLocaleString('es-VE')}`)
      .join('\n')

    return `Estimado/a ${family.representativeName},\n\n` +
      `Le informamos los pagos pendientes de su(s) representado(s):\n\n` +
      `${childrenLines}\n\n` +
      `*Total: USD ${family.totalDebt.toLocaleString('es-VE')}*\n\n` +
      `Puede pagar por: Pago Móvil, Zelle, Binance o Transferencia.\n\nGracias.`
  }

  if (isLoading) {
    return <Page><PageBody><div className="flex min-h-[300px] items-center justify-center"><Spinner /></div></PageBody></Page>
  }

  const multiFamilies = families.filter((f) => f.children.length > 1)

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vista por Familias</h1>
            <p className="text-sm text-muted-foreground">
              Deuda consolidada por representante — {families.length} familias con pagos pendientes
              {multiFamilies.length > 0 && ` (${multiFamilies.length} con hermanos)`}
            </p>
          </div>
        </div>

        {/* Family Cards */}
        {families.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay familias con pagos pendientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {families.map((family, idx) => (
              <div key={idx} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  {/* Family Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{family.representativeName}</span>
                      {family.children.length > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="mr-1 h-3 w-3" />
                          {family.children.length} hijos
                        </Badge>
                      )}
                      {family.chargeCount > 2 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {family.chargeCount} cargos
                        </Badge>
                      )}
                    </div>
                    {/* Children list */}
                    <div className="space-y-1">
                      {family.children.map((child, ci) => (
                        <div key={ci} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          <span>{child.studentName}</span>
                          <Badge variant="outline" className="text-xs">{child.gradeLabel}</Badge>
                          <span className="text-muted-foreground">USD {child.totalDebt.toLocaleString('es-VE')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total + Action */}
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-xl font-bold text-destructive mb-2">
                      USD {family.totalDebt.toLocaleString('es-VE')}
                    </div>
                    {family.phone ? (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                        onClick={() => {
                          const cleanPhone = family.phone!.replace(/[^0-9+]/g, '').replace(/^\+/, '')
                          const msg = buildFamilyMessage(family)
                          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                        }}
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Cobrar familia
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin teléfono</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
