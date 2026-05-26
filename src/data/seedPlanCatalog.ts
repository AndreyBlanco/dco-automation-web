import type { InsurancePlanCatalogEntry } from '../types/models'

/** Seed rows for the in-memory Excel plan catalog (stub backend). */
export const seedPlanCatalog: InsurancePlanCatalogEntry[] = [
  { id: 'cat-1', carrier: 'Aetna', planName: 'Aetna Dental PPO', portalUrl: 'https://www.aetna.com' },
  { id: 'cat-2', carrier: 'SmileCare', planName: 'SmileCare PPO', portalUrl: 'https://example.com/smilecare' },
  { id: 'cat-3', carrier: 'FamilyDental', planName: 'FamilyDental Select', portalUrl: 'https://example.com/familydental' },
  { id: 'cat-4', carrier: 'Delta Dental', planName: 'Delta Dental PPO', portalUrl: 'https://www.deltadental.com' },
]
