'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Upload, FileSpreadsheet, Users, DollarSign, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react'

type ImportType = 'students' | 'payments' | 'grades'

const IMPORT_TYPES: Array<{ id: ImportType; label: string; icon: React.ReactNode; description: string }> = [
  { id: 'students', label: 'Estudiantes', icon: <Users className="h-5 w-5" />, description: 'Nombre, cédula, grado, sección, representante, teléfono' },
  { id: 'payments', label: 'Pagos', icon: <DollarSign className="h-5 w-5" />, description: 'Monto, fecha, método, referencia, estudiante' },
  { id: 'grades', label: 'Notas', icon: <BookOpen className="h-5 w-5" />, description: 'Materia, lapso, nota, estudiante' },
]

const SYSTEMS = [
  { id: 'edudatos', label: 'EduDatos / EduRed' },
  { id: 'gema', label: 'Visual Gema' },
  { id: 'q10', label: 'Q10' },
  { id: 'schooltrack', label: 'SchoolTrack' },
  { id: 'excel', label: 'Excel / Google Sheets' },
  { id: 'other', label: 'Otro sistema' },
]

export default function MigrationPage() {
  const [selectedType, setSelectedType] = React.useState<ImportType>('students')
  const [selectedSystem, setSelectedSystem] = React.useState('excel')
  const [file, setFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [result, setResult] = React.useState<{ success: number; errors: number; duplicates: number } | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Parse file for preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length < 2) {
        flash('El archivo está vacío o no tiene datos', 'error')
        return
      }

      const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ','
      const headers = lines[0].split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''))
      const rows = lines.slice(1, 11).map((line) =>
        line.split(separator).map((f) => f.trim().replace(/^["']|["']$/g, '')),
      )

      setPreview({ headers, rows })
    }
    reader.readAsText(f)
  }

  // Process import
  const handleImport = async () => {
    if (!file) return
    setIsProcessing(true)

    // Read file and send to parser (client-side for now)
    const text = await file.text()

    // Dynamic import of parser
    const { parseStudentsCsv, parsePaymentsCsv, parseGradesCsv } = await import(
      '../../services/csv-parser'
    )

    let parseResult: { success: any[]; errors: any[]; total: number; duplicates: number }

    switch (selectedType) {
      case 'students':
        parseResult = parseStudentsCsv(text)
        break
      case 'payments':
        parseResult = parsePaymentsCsv(text)
        break
      case 'grades':
        parseResult = parseGradesCsv(text)
        break
    }

    setResult({
      success: parseResult.success.length,
      errors: parseResult.errors.length,
      duplicates: parseResult.duplicates,
    })

    if (parseResult.success.length > 0) {
      flash(`Parseados ${parseResult.success.length} registros correctamente. Listos para importar.`, 'success')
    } else {
      flash('No se pudieron parsear registros del archivo', 'error')
    }

    setIsProcessing(false)
  }

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Migración de Datos</h1>
            <p className="text-sm text-muted-foreground">
              Importe datos desde su sistema anterior (CSV o Excel)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Import Type */}
            <div className="rounded-lg border p-4">
              <label className="block text-sm font-medium mb-3">Tipo de importación</label>
              <div className="space-y-2">
                {IMPORT_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      selectedType === type.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importType"
                      value={type.id}
                      checked={selectedType === type.id}
                      onChange={() => setSelectedType(type.id)}
                      className="accent-primary"
                    />
                    <div className="shrink-0 text-muted-foreground">{type.icon}</div>
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Source System */}
            <div className="rounded-lg border p-4">
              <label className="block text-sm font-medium mb-3">Sistema de origen</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
              >
                {SYSTEMS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                El sistema detecta automáticamente las columnas. Seleccione el origen para mejor compatibilidad.
              </p>
            </div>

            {/* File Upload */}
            <div className="rounded-lg border p-4">
              <label className="block text-sm font-medium mb-3">Archivo CSV</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <input
                  type="file"
                  accept=".csv,.tsv,.txt,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground mt-2">CSV, TSV o Excel</p>
              </div>
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview + Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview */}
            {preview && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Vista previa (primeras 10 filas)</span>
                  <Badge variant="outline">{preview.headers.length} columnas detectadas</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {preview.headers.map((h, i) => (
                          <th key={i} className="border px-2 py-1 bg-muted text-left font-medium truncate max-w-[120px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="border px-2 py-1 truncate max-w-[120px]">
                              {cell || <span className="text-muted-foreground">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import Button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleImport}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Procesando...' : `Importar ${selectedType === 'students' ? 'Estudiantes' : selectedType === 'payments' ? 'Pagos' : 'Notas'}`}
                  </Button>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-3">Resultado de la importación</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-md bg-primary/5">
                    <CheckCircle2 className="h-5 w-5 mx-auto text-primary mb-1" />
                    <div className="text-xl font-bold text-primary">{result.success}</div>
                    <div className="text-xs text-muted-foreground">Exitosos</div>
                  </div>
                  <div className="text-center p-3 rounded-md bg-destructive/5">
                    <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-1" />
                    <div className="text-xl font-bold text-destructive">{result.errors}</div>
                    <div className="text-xs text-muted-foreground">Errores</div>
                  </div>
                  <div className="text-center p-3 rounded-md bg-muted">
                    <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <div className="text-xl font-bold">{result.duplicates}</div>
                    <div className="text-xs text-muted-foreground">Duplicados</div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!preview && !result && (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium">Seleccione un archivo para comenzar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suba un archivo CSV exportado de su sistema anterior
                </p>
              </div>
            )}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
