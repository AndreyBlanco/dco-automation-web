import type { SheetRowLastEdit } from './sheet-audit'

/**
 * Operational IVF workflow — Google Sheet as source of truth.
 *
 * Column mapping (operational sheet; robot writes A/C/D/E/F/I/J only):
 *   A = date · C = patient · D = kindOfIns · E = ivfStatus · F = ageType
 *   I = insurance · J = notes
 *   G/H = protected (human workflow — never written by app or robot)
 *
 * @see docs/ARCHITECTURE_IVF_WORKFLOW.md
 */

/** IVF verification outcome in Dentrix (Document Manager / IVF 2026). */
export type IvfStatus = 'New' | 'DONE B'

/** Insurance classification written to column D. */
export type KindOfInsurance = 'PPO' | 'Medicaid' | 'No info'

/** Patient age band written to column F. */
export type AgeType = 'CHILD' | 'TEENAGER' | 'Adult' | ''

/** Filter for dashboard table. */
export type IvfStatusFilter = 'all' | IvfStatus

export type KindOfInsuranceFilter = 'all' | KindOfInsurance

/**
 * One patient row from the operational Google Sheet (via API gateway).
 * `rowIndex` is the 1-based sheet row when the API provides it (for safe PATCH).
 */
export interface SheetRow {
  /** Stable id for UI lists (API may use rowIndex or composite key). */
  id: string
  /** 1-based row in the worksheet, when exposed by backend. */
  rowIndex?: number
  /** Column A — clinic date (YYYY-MM-DD). */
  date: string
  /** Column C — patient display name. */
  patientName: string
  /** Column D. */
  kindOfInsurance: KindOfInsurance
  /** Column E. */
  ivfStatus: IvfStatus
  /** Column F. */
  ageType: AgeType
  /** Column I — normalized carrier label. */
  insurance: string
  /** Column J — multi-line notes (chart, PID, IVF note, etc.). */
  notes: string
  /** Optional appointment time from robot metadata (not always in sheet). */
  appointmentTime?: string
  /** Latest manual edit metadata when API or mock audit provides it. */
  lastEdit?: SheetRowLastEdit
}

/** KPI counts for IVF ops dashboard header. */
export interface SheetRowStats {
  total: number
  newCount: number
  doneBCount: number
}

export function computeSheetRowStats(rows: SheetRow[]): SheetRowStats {
  let newCount = 0
  let doneBCount = 0
  for (const row of rows) {
    if (row.ivfStatus === 'New') newCount += 1
    else if (row.ivfStatus === 'DONE B') doneBCount += 1
  }
  return { total: rows.length, newCount, doneBCount }
}

/** Fields the UI may request to edit via PATCH (backend enforces G/H). */
export type SheetRowEditableField = 'ivfStatus' | 'notes'

export interface SheetRowPatch {
  rowIndex: number
  ivfStatus?: IvfStatus
  notes?: string
}
