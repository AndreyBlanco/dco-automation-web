import type { IvfStatus } from '../../types/sheet-row'
import styles from './Badge.module.css'

const CLASS: Record<IvfStatus, string> = {
  New: styles.pending,
  'DONE B': styles.verified,
}

export function IvfStatusBadge({ status }: { status: IvfStatus }) {
  return (
    <span className={`${styles.badge} ${CLASS[status]}`}>
      {status}
    </span>
  )
}
