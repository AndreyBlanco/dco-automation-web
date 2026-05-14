import type { InsuranceStatus } from '../../types/models'
import styles from './Badge.module.css'

const labels: Record<InsuranceStatus, string> = {
  verified: 'Verified',
  denied: 'Denied',
  pending: 'Pending',
}

export function InsuranceBadge({ status }: { status: InsuranceStatus }) {
  return <span className={`${styles.badge} ${styles[status]}`}>{labels[status]}</span>
}
