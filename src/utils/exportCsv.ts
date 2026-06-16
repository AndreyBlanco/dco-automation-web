import type { SheetRow } from '../types/sheet-row'
import type { SheetReportSummary } from './sheetReports'

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportSheetRowsCsv(rows: SheetRow[], filename = 'ivf-sheet-rows.csv'): void {
  const headers = [
    'date',
    'patientName',
    'kindOfInsurance',
    'ivfStatus',
    'ageType',
    'insurance',
    'notes',
  ]

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.date,
        row.patientName,
        row.kindOfInsurance,
        row.ivfStatus,
        row.ageType || '',
        row.insurance || '',
        row.notes || '',
      ]
        .map(escapeCsvCell)
        .join(','),
    ),
  ]

  downloadTextFile(filename, lines.join('\n'), 'text/csv;charset=utf-8')
}

export function exportReportSummaryCsv(
  summary: SheetReportSummary,
  dateFrom: string,
  dateTo: string,
  filename = 'ivf-report-summary.csv',
): void {
  const lines = [
    'metric,value',
    `dateFrom,${escapeCsvCell(dateFrom)}`,
    `dateTo,${escapeCsvCell(dateTo)}`,
    `totalRows,${summary.total}`,
    `newCount,${summary.newCount}`,
    `doneBCount,${summary.doneBCount}`,
    `completionPct,${summary.completionPct}`,
    '',
    'kindOfInsurance,total,new,doneB',
    ...summary.byKindOfInsurance.map((row) =>
      [row.kind, row.total, row.newCount, row.doneBCount].join(','),
    ),
    '',
    'carrier,total,new,doneB',
    ...summary.topCarriers.map((row) =>
      [escapeCsvCell(row.carrier), row.total, row.newCount, row.doneBCount].join(','),
    ),
  ]

  downloadTextFile(filename, lines.join('\n'), 'text/csv;charset=utf-8')
}
