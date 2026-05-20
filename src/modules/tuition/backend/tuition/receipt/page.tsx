'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { MessageCircle, Download, Printer, ArrowLeft } from 'lucide-react'

/**
 * Receipt View Page
 *
 * Displays a payment receipt as rendered HTML that can be:
 * 1. Shared via WhatsApp (opens wa.me with text summary)
 * 2. Downloaded as image (uses browser print-to-PDF or html2canvas)
 * 3. Printed directly
 *
 * URL: /backend/tuition/receipt?payment_id=uuid
 */

export default function ReceiptPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams?.get('payment_id')

  const [html, setHtml] = React.useState<string | null>(null)
  const [receiptData, setReceiptData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const receiptRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    async function load() {
      if (!paymentId) return
      setIsLoading(true)
      const call = await apiCall<{ html: string; data: any }>(
        `/api/tuition/receipts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId }),
        },
        { fallback: null },
      )
      if (call.ok && call.result) {
        setHtml(call.result.html)
        setReceiptData(call.result.data)
      }
      setIsLoading(false)
    }
    load()
  }, [paymentId])

  // Share via WhatsApp (text summary since wa.me doesn't support images directly)
  const handleShareWhatsApp = () => {
    if (!receiptData) return
    const text = `✅ *RECIBO DE PAGO*\n\n` +
      `*${receiptData.schoolName}*\n` +
      `Recibo N° ${receiptData.receiptNumber}\n\n` +
      `Estudiante: ${receiptData.studentName}\n` +
      `Grado: ${receiptData.gradeLabel} - Sección ${receiptData.section}\n` +
      `Concepto: ${receiptData.concept}\n` +
      `Monto: ${receiptData.currency} ${receiptData.amount}\n` +
      `Método: ${receiptData.paymentMethod}\n` +
      (receiptData.reference ? `Referencia: ${receiptData.reference}\n` : '') +
      `Fecha: ${receiptData.paymentDate}\n\n` +
      `Código: ${receiptData.verificationCode}`

    // If we have the representative's phone, open directly to them
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  // Print
  const handlePrint = () => {
    if (!receiptRef.current) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(html ?? '')
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  // Download as image (triggers print dialog which can save as PDF)
  const handleDownload = () => {
    handlePrint() // Browser print dialog allows "Save as PDF"
  }

  if (!paymentId) {
    return (
      <Page>
        <PageBody>
          <p className="text-muted-foreground">No se especificó un pago. Use ?payment_id=uuid</p>
        </PageBody>
      </Page>
    )
  }

  if (isLoading) {
    return (
      <Page>
        <PageBody>
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner />
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-xl font-bold">Recibo de Pago</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              onClick={handleShareWhatsApp}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Compartir por WhatsApp
            </Button>
            <Button type="button" variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="flex justify-center">
          <div
            ref={receiptRef}
            className="shadow-lg rounded-xl overflow-hidden"
            dangerouslySetInnerHTML={{ __html: html ?? '<p>Error generando recibo</p>' }}
          />
        </div>
      </PageBody>
    </Page>
  )
}
