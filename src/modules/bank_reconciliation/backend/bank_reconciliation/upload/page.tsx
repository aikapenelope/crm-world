/**
 * AGM Exception: raw <table> — data entry grid / dynamic preview
 *
 * This page uses a raw <table> for an interactive data entry grid or
 * a dynamic preview table where the column structure is determined at runtime.
 * DataTable (@open-mercato/ui/backend/DataTable) is designed for static
 * column definitions with sorting/filtering; it does not cleanly support:
 * - Inline input cell editing (grades entry, attendance recording)
 * - Dynamic column counts from imported data (bank statements, CSV preview)
 *
 * Acceptable to keep raw <table>. Column/row rendering logic lives in this
 * component and is not suitable for the tanstack/react-table abstraction.
 */
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { Button } from '@open-mercato/ui/primitives/button'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Upload, FileSpreadsheet } from 'lucide-react'

/**
 * Bank statement upload page.
 * Parses CSV files from Venezuelan banks and sends parsed transactions to the API.
 *
 * Supported banks:
 * - Banesco (format: fecha;referencia;descripcion;debito;credito;saldo)
 * - Mercantil (format: Fecha,Referencia,Descripcion,Monto,Tipo)
 * - Provincial (format: FECHA|REF|DESCRIPCION|DEBITO|CREDITO|SALDO)
 * - BNC (format: fecha,referencia,concepto,debito,credito,saldo)
 * - Generic CSV (auto-detect columns)
 */

type ParsedTransaction = {
  transaction_date: string
  description: string | null
  reference: string | null
  direction: 'credit' | 'debit'
  amount: string
  currency: string
  balance: string | null
}

const BANK_OPTIONS = [
  { code: 'banesco', name: 'Banesco' },
  { code: 'mercantil', name: 'Mercantil' },
  { code: 'provincial', name: 'Provincial (BBVA)' },
  { code: 'bnc', name: 'BNC' },
  { code: 'bdv', name: 'Banco de Venezuela' },
  { code: 'generic', name: 'Otro (CSV genérico)' },
]

function parseCSV(text: string, bankCode: string): ParsedTransaction[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // Skip header
  const dataLines = lines.slice(1)
  const transactions: ParsedTransaction[] = []

  for (const line of dataLines) {
    if (!line.trim()) continue

    // Detect separator
    const separator = line.includes(';') ? ';' : line.includes('|') ? '|' : ','
    const cols = line.split(separator).map((c) => c.trim().replace(/^"|"$/g, ''))

    if (cols.length < 4) continue

    let tx: ParsedTransaction | null = null

    if (bankCode === 'banesco' || bankCode === 'bnc') {
      // fecha;referencia;descripcion;debito;credito;saldo
      const debit = parseFloat(cols[3]?.replace(/[.,]/g, (m, i, s) => i === s.lastIndexOf(m) ? '.' : '') || '0')
      const credit = parseFloat(cols[4]?.replace(/[.,]/g, (m, i, s) => i === s.lastIndexOf(m) ? '.' : '') || '0')
      tx = {
        transaction_date: parseDate(cols[0]),
        reference: cols[1] || null,
        description: cols[2] || null,
        direction: credit > 0 ? 'credit' : 'debit',
        amount: (credit > 0 ? credit : debit).toFixed(2),
        currency: 'VES',
        balance: cols[5] || null,
      }
    } else if (bankCode === 'mercantil') {
      // Fecha,Referencia,Descripcion,Monto,Tipo
      const amount = parseFloat(cols[3]?.replace(/[.,]/g, (m, i, s) => i === s.lastIndexOf(m) ? '.' : '') || '0')
      tx = {
        transaction_date: parseDate(cols[0]),
        reference: cols[1] || null,
        description: cols[2] || null,
        direction: cols[4]?.toLowerCase().includes('cred') ? 'credit' : 'debit',
        amount: Math.abs(amount).toFixed(2),
        currency: 'VES',
        balance: null,
      }
    } else {
      // Generic: try to auto-detect
      const debit = parseFloat(cols[3]?.replace(/[.,]/g, (m, i, s) => i === s.lastIndexOf(m) ? '.' : '') || '0')
      const credit = parseFloat(cols[4]?.replace(/[.,]/g, (m, i, s) => i === s.lastIndexOf(m) ? '.' : '') || '0')
      tx = {
        transaction_date: parseDate(cols[0]),
        reference: cols[1] || null,
        description: cols[2] || null,
        direction: credit > 0 ? 'credit' : 'debit',
        amount: (credit > 0 ? credit : debit).toFixed(2),
        currency: 'VES',
        balance: cols[5] || null,
      }
    }

    if (tx && tx.amount !== '0.00') {
      transactions.push(tx)
    }
  }

  return transactions
}

function parseDate(dateStr: string): string {
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[/\-.]/)
  if (parts.length === 3) {
    const [d, m, y] = parts
    if (Number(y) > 2000) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  // Fallback: return as-is (ISO format)
  return dateStr
}

export default function UploadStatementPage() {
  const router = useRouter()
  const [bankCode, setBankCode] = React.useState('banesco')
  const [periodMonth, setPeriodMonth] = React.useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [accountNumber, setAccountNumber] = React.useState('')
  const [parsedTransactions, setParsedTransactions] = React.useState<ParsedTransaction[]>([])
  const [filename, setFilename] = React.useState('')
  const [isUploading, setIsUploading] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const transactions = parseCSV(text, bankCode)
      setParsedTransactions(transactions)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleUpload = async () => {
    if (parsedTransactions.length === 0) {
      flash('No hay transacciones para cargar', 'error')
      return
    }

    setIsUploading(true)
    const bankName = BANK_OPTIONS.find((b) => b.code === bankCode)?.name ?? bankCode

    const payload = {
      bank_code: bankCode,
      bank_name: bankName,
      account_number: accountNumber || null,
      period_month: periodMonth,
      filename,
      transactions: parsedTransactions,
    }

    const call = await apiCall<{ ok: boolean; statement_id: string; transactions_count: number }>(
      '/api/bank-reconciliation/upload',
      { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } },
      { fallback: null as any },
    )

    if (call.ok && call.result?.ok) {
      flash(`Extracto cargado: ${call.result.transactions_count} movimientos`, 'success')
      router.push('/backend/bank_reconciliation')
    } else {
      flash('Error al cargar el extracto', 'error')
    }
    setIsUploading(false)
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cargar Extracto Bancario</h1>
            <p className="text-sm text-muted-foreground">Suba el CSV descargado de su banco para conciliar</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Banco</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
            >
              {BANK_OPTIONS.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Período</label>
            <input
              type="month"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Número de cuenta (opcional)</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0134-0000-00-0000000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Archivo CSV</label>
            <input
              type="file"
              accept=".csv,.txt"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Descargue el estado de cuenta de su banco en formato CSV y súbalo aquí.
            </p>
          </div>
        </div>

        {/* Preview */}
        {parsedTransactions.length > 0 && (
          <div className="mt-6 rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="size-4 text-primary" />
              <span className="font-medium">{parsedTransactions.length} movimientos detectados</span>
            </div>
            <div className="max-h-60 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Fecha</th>
                    <th className="text-left p-1">Ref.</th>
                    <th className="text-left p-1">Descripción</th>
                    <th className="text-left p-1">Tipo</th>
                    <th className="text-right p-1">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.slice(0, 20).map((tx, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-1">{tx.transaction_date}</td>
                      <td className="p-1">{tx.reference ?? '—'}</td>
                      <td className="p-1 max-w-[200px] truncate">{tx.description ?? '—'}</td>
                      <td className="p-1">{tx.direction === 'credit' ? 'Crédito' : 'Débito'}</td>
                      <td className="p-1 text-right font-mono">{tx.currency} {tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedTransactions.length > 20 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Mostrando 20 de {parsedTransactions.length} movimientos...
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <Button type="button" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Cargando...' : 'Confirmar y Cargar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/backend/bank_reconciliation')}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
