'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Star, Users, Gift, Megaphone } from 'lucide-react'

type LoyaltyStats = {
  total_members: number
  total_points_issued: number
  total_points_redeemed: number
  active_campaigns: number
}

export default function RetailLoyaltyPage() {
  const router = useRouter()
  const [stats, setStats] = React.useState<LoyaltyStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: any[] }>(
        '/api/retail-loyalty/accounts?pageSize=1',
        undefined,
        { fallback: { items: [] } },
      )
      // Build stats from accounts list (simplified)
      setStats({
        total_members: call.ok ? (call.result?.items?.length ?? 0) : 0,
        total_points_issued: 0,
        total_points_redeemed: 0,
        active_campaigns: 0,
      })
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>
    )
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Programa de Fidelización</h1>
              <p className="text-sm text-muted-foreground">Gestiona puntos, niveles VIP y campañas</p>
            </div>
          </div>
          <Button type="button" onClick={() => router.push('/backend/retail_loyalty/campaigns/create')}>
            <Megaphone className="mr-2 size-4" />
            Nueva Campaña
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Miembros</p>
            </div>
            <p className="text-2xl font-bold">{stats?.total_members ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Puntos Emitidos</p>
            </div>
            <p className="text-2xl font-bold">{(stats?.total_points_issued ?? 0).toLocaleString('es-VE')}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Puntos Canjeados</p>
            </div>
            <p className="text-2xl font-bold">{(stats?.total_points_redeemed ?? 0).toLocaleString('es-VE')}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Campañas Activas</p>
            </div>
            <p className="text-2xl font-bold">{stats?.active_campaigns ?? 0}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => router.push('/backend/retail_loyalty/members')}
            className="rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Miembros</h3>
            <p className="text-sm text-muted-foreground">Ver clientes, puntos y niveles</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/backend/retail_loyalty/campaigns')}
            className="rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Campañas</h3>
            <p className="text-sm text-muted-foreground">Crear y gestionar campañas de marketing</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/backend/retail_loyalty/programs')}
            className="rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Configuración</h3>
            <p className="text-sm text-muted-foreground">Programa, niveles y reglas de puntos</p>
          </button>
        </div>
      </PageBody>
    </Page>
  )
}
