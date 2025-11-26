import { createContext } from 'react'

const I18nCtx = createContext({ lang: 'pl', t: (key) => key, setLang: () => {} })
export default I18nCtx

