# Education UI Sprint Plan — Páginas Operativas

> Plan de sprints para las páginas de UI que hacen funcional la vertical de colegios.
> Cada sprint produce páginas listas para producción siguiendo Open Mercato UI patterns.

---

## Contexto

El backend (APIs, entidades, workers, lógica) está completo. Este plan cubre las páginas
de UI que el empleado del colegio usa día a día. Cada página debe:

1. Seguir los patrones de `docs/UI_DEVELOPMENT_GUIDE.md`
2. Usar componentes de `@open-mercato/ui` (nunca HTML raw)
3. Tener iconos de lucide-react en botones de acción
4. Ser responsive y funcional en tablet (los colegios usan tablets)
5. Tener feedback visual claro (flash messages, badges, progress bars)

---

## Sprint 1: Cobro por WhatsApp (página dedicada)

**Página:** `/backend/tuition/cobro`

**Funcionalidad:**
- Lista de morosos/pendientes con nombre del estudiante, representante, teléfono, monto
- Botón verde de WhatsApp por cada fila (icono MessageCircle + "Enviar")
- Botón "Enviar todos" que abre los links secuencialmente (con delay de 2s entre cada uno)
- Filtros: por mes, por grado, por status (pendiente/vencido)
- Preview del mensaje antes de enviar
- Contador: "15 de 23 tienen teléfono registrado"
- Badge de status por cada cargo (pendiente = amarillo, vencido = rojo)
- Nombre completo del estudiante (no UUID)
- Nombre del representante con teléfono visible

**Archivos:**
- `src/modules/tuition/backend/tuition/cobro/page.meta.ts`
- `src/modules/tuition/backend/tuition/cobro/page.tsx`

---

## Sprint 2: Generación de Cargos + Recibos

**Página:** `/backend/tuition/generate` (Generar cargos del mes)

**Funcionalidad:**
- Selector de mes (YYYY-MM)
- Selector de plan (opcional, default = todos)
- Preview: "Se generarán 287 cargos para Octubre 2026"
- Botón "Generar" con confirmación
- Resultado: "Generados 287, omitidos 12 (ya existían)"
- Progress indicator durante la generación

**Página:** `/backend/tuition/payments/[id]/receipt` (Ver recibo)

**Funcionalidad:**
- Muestra el recibo como imagen (HTML renderizado)
- Botón "Compartir por WhatsApp" (abre wa.me con imagen adjunta o link)
- Botón "Descargar PNG"
- Botón "Imprimir"
- Logo del colegio en el header del recibo

**Archivos:**
- `src/modules/tuition/backend/tuition/generate/page.meta.ts`
- `src/modules/tuition/backend/tuition/generate/page.tsx`
- `src/modules/tuition/backend/tuition/payments/[id]/receipt/page.tsx`

---

## Sprint 3: Página de Morosos + Estado de Cuenta

**Página:** `/backend/tuition/debtors` (Morosos)

**Funcionalidad:**
- DataTable con: estudiante (nombre completo), grado, representante, monto total adeudado, meses vencidos
- Badge rojo con cantidad de meses morosos
- Botón "Cobrar por WhatsApp" por fila
- Botón "Ver estado de cuenta" por fila
- Resumen arriba: total moroso, cantidad de estudiantes, monto total
- Filtro por grado, por meses de mora (1, 2, 3+)
- Exportar a Excel (para reuniones de directiva)

**Página:** `/backend/tuition/account/[studentId]` (Estado de cuenta por estudiante)

**Funcionalidad:**
- Header: nombre del estudiante, grado, sección, representante
- Timeline de cargos y pagos (cronológico)
- Balance actual (debe / ha pagado / saldo)
- Botón "Generar estado de cuenta PDF"
- Botón "Enviar por WhatsApp"
- Historial de pagos con método, referencia, fecha

**Archivos:**
- `src/modules/tuition/backend/tuition/debtors/page.meta.ts`
- `src/modules/tuition/backend/tuition/debtors/page.tsx`
- `src/modules/tuition/backend/tuition/account/[studentId]/page.tsx`

---

## Sprint 4: Registro de Pago Mejorado

**Página:** `/backend/tuition/payments` (Registrar pago — mejorada)

**Funcionalidad:**
- Buscador de estudiante por nombre (autocomplete)
- Al seleccionar estudiante: muestra cargos pendientes automáticamente
- Seleccionar cargo(s) a pagar
- Formulario: monto, moneda, método de pago, referencia, fecha
- Si paga en VES: campo de tasa de cambio (auto-fill desde venezuela_rates)
- Al guardar: genera recibo automáticamente
- Botón "Enviar recibo por WhatsApp" post-pago
- Flash: "Pago registrado. Recibo generado."

**Archivos:**
- `src/modules/tuition/backend/tuition/payments/page.meta.ts`
- `src/modules/tuition/backend/tuition/payments/page.tsx`

---

## Sprint 5: Dashboard Widgets + Resumen por Hermanos

**Widgets adicionales:**
- Widget "Morosos por grado" (bar chart simple)
- Widget "Pagos recientes" (últimos 5 pagos con método y monto)
- Widget "Alerta hermanos" (representantes con 2+ hijos que deben)

**Página:** `/backend/tuition/siblings` (Vista consolidada por representante)

**Funcionalidad:**
- Agrupa estudiantes por representante
- Muestra deuda total consolidada por familia
- Botón "Cobrar familia completa" (un solo mensaje WA con todos los hijos)
- Descuento de hermanos visible

**Archivos:**
- `src/modules/tuition/widgets/dashboard/debtors-by-grade/`
- `src/modules/tuition/widgets/dashboard/recent-payments/`
- `src/modules/tuition/backend/tuition/siblings/page.tsx`

---

## Sprint 6: Migración UI + Modo "Día de Cobro"

**Página:** `/backend/school-migration` (Importar datos)

**Funcionalidad:**
- Selector de sistema origen (EduDatos, Visual Gema, Q10, Excel, Otro)
- Upload de archivo CSV/Excel
- Preview con tabla de datos parseados (primeras 10 filas)
- Mapeo de columnas (auto-detectado, editable)
- Indicador de errores y duplicados
- Botón "Importar" con progress bar
- Resultado: "Importados 287 estudiantes, 3 errores, 5 duplicados"
- Tabs: Estudiantes, Pagos, Notas (3 tipos de importación)

**Página:** `/backend/tuition/collection-day` (Modo día de cobro)

**Funcionalidad:**
- Vista simplificada para cuando los representantes vienen a pagar
- Buscador grande (nombre o cédula del estudiante)
- Al encontrar: muestra deuda pendiente + botón "Registrar pago"
- Flujo rápido: buscar → ver deuda → registrar → recibo → siguiente
- Sin navegación compleja, optimizado para velocidad

**Archivos:**
- `src/modules/school_migration/backend/school_migration/page.meta.ts`
- `src/modules/school_migration/backend/school_migration/page.tsx`
- `src/modules/tuition/backend/tuition/collection-day/page.meta.ts`
- `src/modules/tuition/backend/tuition/collection-day/page.tsx`

---

## Resumen de PRs

| PR | Sprints | Páginas | Resultado |
|---|---|---|---|
| **PR #1** | 1-3 | cobro WA, generar cargos, recibos, morosos, estado de cuenta | Cobro funcional |
| **PR #2** | 4-6 | registro pago mejorado, widgets, hermanos, migración, día de cobro | Experiencia completa |

---

## Compatibilidad

- Todas las páginas usan `'use client'` (client components)
- Imports solo de `@open-mercato/ui/*` y `@open-mercato/shared/*`
- No se modifica ningún archivo de Open Mercato core
- Compatible con Coolify auto-deploy (push to main)
- Responsive: funciona en desktop y tablet
- i18n: todas las strings en archivos JSON (es.json + en.json)
