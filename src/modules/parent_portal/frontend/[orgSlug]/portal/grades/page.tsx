'use client'

import * as React from 'react'
import { ArrowLeft } from 'lucide-react'

type Props = { params: { orgSlug: string } }


export default function PortalGradesPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <a href={`/${params.orgSlug}/portal/dashboard`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al portal
        </a>
        <h1 className="text-2xl font-bold mb-6">Notas y Boletines</h1>
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-gray-500">Cargando boletines...</p>
          <p className="text-sm text-gray-400 mt-2">Las notas se publican al final de cada lapso.</p>
        </div>
      </div>
    </div>
  )
}
