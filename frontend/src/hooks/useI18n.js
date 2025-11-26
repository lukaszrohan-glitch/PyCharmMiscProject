import { useContext } from 'react'
import I18nCtx from '../contexts/I18nCtx'

export default function useI18n() {
  return useContext(I18nCtx)
}
