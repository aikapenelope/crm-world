'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { MapPin, Users, Package } from 'lucide-react'

type Branch = {
  id: string
  name: string
  code: string
  branch_type: string
  address_line1: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  manager_user_id: string | null
  created_at: string
}

type StaffMember = {
  id: string
  user_id: string
  role: string
  is_primary: boolean
}

const typeLabels: Record<string, string> = {
  store: 'Tienda',
  warehouse: 'Bodega',
  kiosk: 'Kiosco',
  popup: 'Pop-up',
}

const roleLabels: Record<string, string> = {
  manager: 'Gerente',
  cashier: 'Cajero',
  stock_clerk: 'Almacenista',
  sales_rep: 'Vendedor',
}

export default function BranchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const branchId = params.id as string

  const [branch, setBranch] = React.useState<Branch | null>(null)
  const [staff, setStaff] = React.useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'info' | 'staff' | 'inventory'>('info')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [branchCall, staffCall] = await Promise.all([
        apiCall<{ item: Branch }>(`/api/retail-branches/branches?id=${branchId}`, undefined, { fallback: null as any }),
        apiCall<{ items: StaffMember[] }>(`/api/retail-branches/staff?branch_id=${branchId}`, undefined, { fallback: { items: [] } }),
      ])
      if (branchCall.ok && branchCall.result) {
        setBranch(branchCall.result.item)
      }
      if (staffCall.ok) {
        setStaff(staffCall.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [branchId])

  async function toggleActive() {
    if (!branch) return
    const call = await apiCall('/api/retail-branches/branches', {
      method: 'PUT',
      body: JSON.stringify({ id: branch.id, is_active: !branch.is_active }),
    })
    if (call.ok) {
      setBranch({ ...branch, is_active: !branch.is_active })
      flash(branch.is_active ? 'Sucursal desactivada' : 'Sucursal activada', 'success')
    }
  }

  if (isLoading) {
    return (
      <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>
    )
  }

  if (!branch) {
    return (
      <Page><PageBody><div className="text-center py-8 text-muted-foreground">Sucursal no encontrada.</div></PageBody></Page>
    )
  }

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{branch.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{branch.code}</span>
                <Badge variant="outline">{typeLabels[branch.branch_type] ?? branch.branch_type}</Badge>
                <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                  {branch.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={toggleActive}>
              {branch.is_active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-4">
            <button
              type="button"
              className={`pb-2 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('info')}
            >
              Información
            </button>
            <button
              type="button"
              className={`pb-2 text-sm font-medium border-b-2 ${activeTab === 'staff' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('staff')}
            >
              <Users className="inline size-4 mr-1" />
              Personal ({staff.length})
            </button>
            <button
              type="button"
              className={`pb-2 text-sm font-medium border-b-2 ${activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Package className="inline size-4 mr-1" />
              Inventario
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Ubicación</h3>
              <div className="rounded-lg border p-4 space-y-2">
                {branch.address_line1 && <p className="text-sm">{branch.address_line1}</p>}
                <p className="text-sm text-muted-foreground">
                  {[branch.city, branch.state].filter(Boolean).join(', ') || 'Sin dirección'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Contacto</h3>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm">Tel: {branch.phone ?? '—'}</p>
                <p className="text-sm">Email: {branch.email ?? '—'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="max-w-2xl">
            {staff.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay personal asignado a esta sucursal.</p>
            ) : (
              <div className="space-y-2">
                {staff.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Users className="size-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{s.user_id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{roleLabels[s.role] ?? s.role}</Badge>
                      {s.is_primary && <Badge variant="default">Principal</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-sm">
              El inventario de esta sucursal se gestiona desde el módulo de Inventario Retail
              con el código de bodega <span className="font-mono font-bold">{branch.code}</span>.
            </p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
