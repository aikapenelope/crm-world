'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { ShoppingCart } from 'lucide-react'

type Product = {
  id: string
  title: string
  subtitle: string | null
  sku: string | null
  handle: string | null
}

export default function StorefrontPage() {
  const params = useParams()
  const slug = params.slug as string
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const url = search
        ? `/api/retail-ecommerce/catalog?pageSize=24&search=${encodeURIComponent(search)}`
        : '/api/retail-ecommerce/catalog?pageSize=24'
      const call = await apiCall<{ items: Product[] }>(url, undefined, { fallback: { items: [] } })
      if (call.ok) {
        setProducts(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [search])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Tienda</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="rounded-md border px-3 py-1.5 text-sm w-64"
            />
            <Link
              href={`/tienda/${slug}/cart`}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary"
            >
              <ShoppingCart className="size-5" />
              Carrito
            </Link>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay productos disponibles.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/tienda/${slug}/${product.id}`}
                className="rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                  <ShoppingCart className="size-8 text-muted-foreground/30" />
                </div>
                <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                {product.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.subtitle}</p>
                )}
                {product.sku && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">SKU: {product.sku}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
