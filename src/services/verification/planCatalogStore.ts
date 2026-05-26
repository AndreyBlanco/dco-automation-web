import { seedPlanCatalog } from '../../data/seedPlanCatalog'
import type { InsurancePlanCatalogEntry } from '../../types/models'
import type { CatalogLookupResponse } from '../../types/verification-api'

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** In-memory Excel catalog — stub until Python service reads/writes a real file. */
let catalogRows: InsurancePlanCatalogEntry[] = seedPlanCatalog.map((row) => ({ ...row }))

export function listPlanCatalog(): InsurancePlanCatalogEntry[] {
  return catalogRows.map((row) => ({ ...row }))
}

export function lookupPlan(carrier: string, planName: string): CatalogLookupResponse {
  const c = normalize(carrier)
  const p = normalize(planName)
  const hit = catalogRows.find(
    (row) => normalize(row.carrier) === c && normalize(row.planName) === p,
  )
  if (!hit) {
    return { found: false, carrier, planName }
  }
  return {
    found: true,
    carrier: hit.carrier,
    planName: hit.planName,
    portalUrl: hit.portalUrl,
  }
}

export function addPlanToCatalog(
  carrier: string,
  planName: string,
  portalUrl?: string,
): InsurancePlanCatalogEntry {
  const existing = lookupPlan(carrier, planName)
  if (existing.found) {
    const hit = catalogRows.find(
      (row) =>
        normalize(row.carrier) === normalize(carrier) &&
        normalize(row.planName) === normalize(planName),
    )!
    return { ...hit }
  }
  const row: InsurancePlanCatalogEntry = {
    id: `cat-${Date.now()}`,
    carrier: carrier.trim(),
    planName: planName.trim(),
    portalUrl,
  }
  catalogRows = [row, ...catalogRows]
  return { ...row }
}

/** Reset catalog to seed data (tests / demos). */
export function resetPlanCatalog(): void {
  catalogRows = seedPlanCatalog.map((row) => ({ ...row }))
}
