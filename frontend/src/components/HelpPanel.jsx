import { useEffect } from 'react'
import ModalOverlay from './ModalOverlay'
import styles from './HelpPanel.module.css'

export default function HelpPanel({ lang = 'pl', onClose, onOpenGuide }) {
  const t = lang === 'pl'
    ? {
        title: 'Centrum pomocy',
        subtitle: 'Szybki dostęp do dokumentacji i skrótów',
        docs: 'Dokumentacja i poradnik użytkownika',
        shortcutsTitle: 'Skróty klawiaturowe',
        footer: 'Masz pytania? Skontaktuj się z administratorem systemu.',
        close: 'Zamknij',
        esc: 'Esc aby zamknąć',
      }
    : {
        title: 'Help Center',
        subtitle: 'Quick access to documentation & shortcuts',
        docs: 'Documentation & user guide',
        shortcutsTitle: 'Keyboard shortcuts',
        footer: 'Need assistance? Contact your system administrator.',
        close: 'Close',
        esc: 'Esc to close',
      }

  const shortcuts = lang === 'pl'
    ? [
        { key: '/', label: 'Skup wyszukiwanie' },
        { key: '?', label: 'Pokaż skróty' },
        { key: 'Esc', label: 'Zamknij aktywne okno' },
      ]
    : [
        { key: '/', label: 'Focus global search' },
        { key: '?', label: 'Show shortcuts' },
        { key: 'Esc', label: 'Close active overlay' },
      ]

  const openGuide = () => {
    onClose?.()
    onOpenGuide?.()
  }

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose?.()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])


  return (
    <ModalOverlay ariaLabel={t.title} onClose={onClose} className={styles.backdrop}>
      <div className={styles.panel} role="document">
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.title}>{t.title}</div>
            <div className={styles.subtitle}>{t.subtitle}</div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose?.()
            }}
            title={t.close}
            aria-label={t.close}
          >
            ×
          </button>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t.docs}</div>
          <div className={styles.links}>
            <button
              className={styles.linkBtn}
              onClick={openGuide}
            >
              <span>{lang === 'pl' ? 'Poradnik użytkownika' : 'User guide'}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t.shortcutsTitle}</div>
          <div className={styles.shortcuts}>
            {shortcuts.map((item) => (
              <div key={item.key} className={styles.shortcutRow}>
                <span>{item.label}</span>
                <kbd>{item.key}</kbd>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.footer}>
          <span>{t.footer}</span>
          <span className={styles.chip}>{t.esc}</span>
        </div>
      </div>
    </ModalOverlay>
  )
}
