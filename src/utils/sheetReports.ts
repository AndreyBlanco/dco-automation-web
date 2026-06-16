import type { KindOfInsurance, SheetRow } from '../types/sheet-row'

export interface InsuranceKindBreakdown {
  kind: KindOfInsurance
  total: number
  newCount: number
  doneBCount: number
}

export interface CarrierBreakdown {
  carrier: string
  total: number
  newCount: number
  doneBCount: number
}

export interface SheetReportSummary {
  total: number
  newCount: number
  doneBCount: number
  completionPct: number
  byKindOfInsurance: InsuranceKindBreakdown[]
  topCarriers: CarrierBreakdown[]
}

const KIND_ORDER: KindOfInsurance[] = ['PPO', 'Medicaid', 'No info']

export function computeSheetReportSummary(rows: SheetRow[]): SheetReportSummary {
  let newCount = 0
  let doneBCount = 0

  const byKind = new Map<KindOfInsurance, InsuranceKindBreakdown>()
  const byCarrier = new Map<string, CarrierBreakdown>()

  for (const row of rows) {
    if (row.ivfStatus === 'New') newCount += 1
    else doneBCount += 1

    const kindEntry = byKind.get(row.kindOfInsurance) ?? {
      kind: row.kindOfInsurance,
      total: 0,
      newCount: 0,
      doneBCount: 0,
    }
    kindEntry.total += 1
    if (row.ivfStatus === 'New') kindEntry.newCount += 1
    else kindEntry.doneBCount += 1
    byKind.set(row.kindOfInsurance, kindEntry)

    const carrier = row.insurance?.trim() || '(empty)'
    const carrierEntry = byCarrier.get(carrier) ?? {
      carrier,
      total: 0,
      newCount: 0,
      doneBCount: 0,
    }
    carrierEntry.total += 1
    if (row.ivfStatus === 'New') carrierEntry.newCount += 1
    else carrierEntry.doneBCount += 1
    byCarrier.set(carrier, carrierEntry)
  }

  const total = rows.length
  const completionPct = total === 0 ? 0 : Math.round((doneBCount / total) * 100)

  return {
    total,
    newCount,
    doneBCount,
    completionPct,
    byKindOfInsurance: KIND_ORDER.map((kind) =>
      byKind.get(kind) ?? { kind, total: 0, newCount: 0, doneBCount: 0 },
    ),
    topCarriers: [...byCarrier.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 6),
  }
}
