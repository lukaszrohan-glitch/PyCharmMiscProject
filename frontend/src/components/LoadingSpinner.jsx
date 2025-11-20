import React from 'react'
import styles from './LoadingSpinner.module.css'

/**
 * Reusable loading spinner with optional text
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner text="Ładowanie..." />
 *   <LoadingSpinner size="small" />
 */
export default function LoadingSpinner({
  text = '',
  size = 'medium', // 'small' | 'medium' | 'large'
  inline = false
}) {
  const Component = inline ? 'span' : 'div'

  return (
    <Component className={`${styles.container} ${inline ? styles.inline : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`} role="status" aria-label="Ładowanie">
        <div className={styles.bounce1}></div>
        <div className={styles.bounce2}></div>
        <div className={styles.bounce3}></div>
      </div>
      {text && <span className={styles.text}>{text}</span>}
    </Component>
  )
}

