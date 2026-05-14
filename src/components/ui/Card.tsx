import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  noHover?: boolean
}

export function Card({ children, className = '', noHover, ...rest }: CardProps) {
  const cls = [styles.card, noHover ? styles.noHover : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
