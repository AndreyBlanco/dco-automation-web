import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

export function TextField({ label, id, className = '', ...rest }: TextFieldProps) {
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input id={id} className={`${styles.input} ${className}`} {...rest} />
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  id: string
}

export function TextAreaField({
  label,
  id,
  className = '',
  ...rest
}: TextAreaFieldProps) {
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={`${styles.input} ${styles.textarea} ${className}`}
        {...rest}
      />
    </div>
  )
}
