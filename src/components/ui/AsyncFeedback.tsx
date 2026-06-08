import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './AsyncFeedback.module.css'

type LoadingStateProps = {
  message?: string
  compact?: boolean
}

export function LoadingState({ message = 'Loading…', compact }: LoadingStateProps) {
  return (
    <div
      className={`${styles.feedback} ${compact ? styles.compact : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} aria-hidden />
      <p className={styles.message}>{message}</p>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.feedback} role="status">
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}

type ErrorStateProps = {
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({ message, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  return (
    <div className={styles.feedback} role="alert">
      <p className={styles.errorTitle}>Something went wrong</p>
      <p className={styles.description}>{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
