import React from 'react'

export default function ShortcutsModal({ lang = 'pl', onClose }) {
  const t = lang === 'pl' ? {
    title: 'Skróty klawiaturowe',
    search: 'Skup wyszukiwanie',
    help: 'Pokaż skróty',
    esc: 'Zamknij',
  } : {
    title: 'Keyboard Shortcuts',
    search: 'Focus search',
    help: 'Show shortcuts',
    esc: 'Close',
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t.title}</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8}}>
          <li><kbd>/</kbd> — {t.search}</li>
          <li><kbd>?</kbd> — {t.help}</li>
          <li><kbd>Esc</kbd> — {t.esc}</li>
        </ul>
      </div>
      <style jsx>{`
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal-content{background:var(--background,#fff);color:var(--text,#111);border:1px solid var(--border,#ddd);border-radius:12px;max-width:420px;width:100%;padding:16px;box-shadow:0 24px 60px rgba(0,0,0,.2)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .modal-title{font-weight:700}
        .close-btn{background:transparent;border:1px solid var(--border,#ddd);width:28px;height:28px;border-radius:8px}
        kbd{background:#111;color:#fff;border-radius:6px;padding:2px 6px;margin-right:6px}
      `}</style>
    </div>
  )
}

