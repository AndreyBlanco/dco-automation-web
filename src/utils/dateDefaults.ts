/** ISO date string YYYY-MM-DD in local timezone. */
function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** First day of the current calendar month. */
export function defaultSheetDateFrom(): string {
  const now = new Date()
  return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

/** Today (end of default dashboard range). */
export function defaultSheetDateTo(): string {
  return toIsoDate(new Date())
}

/** Suggested start date for Dentrix sync (today). */
export function defaultSyncStartDate(): string {
  return toIsoDate(new Date())
}
