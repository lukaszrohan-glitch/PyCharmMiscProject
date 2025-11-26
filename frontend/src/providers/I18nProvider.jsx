import { useState, useEffect, useCallback } from 'react'
import { translations } from '../translations'
import I18nCtx from '../contexts/I18nCtx'

export default function I18nProvider({ children, defaultLang }) {
  const initial = defaultLang || import.meta.env.VITE_DEFAULT_LANG || 'pl'
  const [lang, setLang] = useState(initial)

  useEffect(() => {
    const stored = localStorage.getItem('app_lang')
    if (stored && stored !== lang) setLang(stored)
  }, [lang])

  useEffect(() => {
    localStorage.setItem('app_lang', lang)
  }, [lang])

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.pl
    return dict[key] || key
  }, [lang])

  return (
    <I18nCtx.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nCtx.Provider>
  )
}
