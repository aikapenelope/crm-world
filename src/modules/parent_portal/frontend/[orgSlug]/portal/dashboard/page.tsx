'use client'

import * as React from 'react'
import { DollarSign, BookOpen, ClipboardCheck, FileText } from 'lucide-react'

type Props = { params: { orgSlug: string } }


/**
 * Parent Portal Dashboard
 *
 * Shows a summary for the representative:
 * - Children enrolled
 * - Payment status (pending/paid)
 * - Latest grades
 * - Attendance summary
 */

export default function ParentPortalDashboard({ params }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Bienvenido al Portal</h1>
        <p className="text-gray-500 mb-6">Consulte la información de sus representados</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href={`/${params.orgSlug}/portal/payments`} className="block rounded-lg border bg-white p-6 hover:shadow-md transition-shadow">
            <DollarSign className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-lg font-semibold">Estado de Cuenta</h2>
            <p className="text-sm text-gray-500 mt-1">Ver pagos pendientes y realizados</p>
          </a>

          <a href={`/${params.orgSlug}/portal/grades`} className="block rounded-lg border bg-white p-6 hover:shadow-md transition-shadow">
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-lg font-semibold">Notas y Boletines</h2>
            <p className="text-sm text-gray-500 mt-1">Consultar calificaciones por lapso</p>
          </a>

          <a href={`/${params.orgSlug}/portal/attendance`} className="block rounded-lg border bg-white p-6 hover:shadow-md transition-shadow">
            <ClipboardCheck className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-lg font-semibold">Asistencia</h2>
            <p className="text-sm text-gray-500 mt-1">Ver registro de asistencia mensual</p>
          </a>

          <a href={`/${params.orgSlug}/portal/documents`} className="block rounded-lg border bg-white p-6 hover:shadow-md transition-shadow">
            <FileText className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-lg font-semibold">Documentos</h2>
            <p className="text-sm text-gray-500 mt-1">Constancias y comunicaciones</p>
          </a>
        </div>
      </div>
    </div>
  )
}
