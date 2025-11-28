import { useCallback, useEffect, useState } from 'react'
import * as api from '../services/api'
import { useToast } from '../lib/toastContext'
import ModalOverlay from './ModalOverlay'

const formatCurrency = (value, lang = 'pl') => {
  const formatter = new Intl.NumberFormat(lang === 'pl' ? 'pl-PL' : 'en-US', {
    style: 'currency',
    currency: lang === 'pl' ? 'PLN' : 'USD'
  })
  return formatter.format(Number(value || 0))
}

export default function Financials({ orderId, lang }){
    const toast = useToast()
    const [orders, setOrders] = useState([])
    const [selected, setSelected] = useState(null)
    const [finance, setFinance] = useState(null)
    const [loading, setLoading] = useState(false)

  const closeModal = useCallback(() => {
    setSelected(null)
    setFinance(null)
  }, [])

    const t = lang==='pl' ? {
    title:'Finanse', select:'Wybierz zamówienie', order:'Zamówienie', revenue:'Przychód', material:'Koszt materiałów', labor:'Koszt pracy', margin:'Marża brutto', marginPct:'Marża %', loading:'Ładowanie danych...', details:'Szczegóły', close:'Zamknij'
  } : { title:'Financials', select:'Select order', order:'Order', revenue:'Revenue', material:'Material cost', labor:'Labor cost', margin:'Gross margin', marginPct:'Margin %', loading:'Loading data...', details:'Details', close:'Close' }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await api.getOrders()
        if (active) setOrders(data || [])
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load orders for Financials:', err)
        }
      }
    })()
    return () => { active = false }
  }, [])

  const load = useCallback(async (o) => {
    setSelected(o)
    setLoading(true)
    try {
      setFinance(await api.getFinance(o.order_id))
    } catch (e) {
      toast.show((lang==='pl'?'Błąd: ':'Error: ')+ (e.message || String(e)), 'error')
    } finally {
      setLoading(false)
    }
  }, [lang, toast])

  // If orderId is provided, preselect and load it once orders fetched
  useEffect(() => {
    if (!orderId || !orders?.length) return
    const matched = orders.find(x => String(x.order_id) === String(orderId))
    if (matched) {
      load(matched)
    }
  }, [orderId, orders, load])
   const fmt = (n)=> formatCurrency(n, lang)
   const fmtPct = ()=>{
      if (!finance || !finance.revenue) return '–'
      const rev = Number(finance.revenue||0)
      const mar = Number(finance.gross_margin||0)
      if (!rev) return '–'
      return `${((mar/rev)*100).toFixed(1)}%`
    }

    return (
     <div className="financials-container">
       <div className="financials-header">
         <h2>{t.title}</h2>
         <select onChange={e=>{ const o=orders.find(x=>x.order_id===e.target.value); if(o) load(o) }} value={selected?.order_id||''}>
           <option value="">{t.select}</option>
           {orders.map(o=> <option key={o.order_id} value={o.order_id}>{o.order_id}</option>)}
         </select>
       </div>
       {loading && (
         <div className="financials-loading" role="status" aria-live="polite">
           {t.loading}
         </div>
       )}
       {selected && (
         <ModalOverlay ariaLabel={t.close} onClose={closeModal}>
           <div className="modal" role="dialog" aria-modal="true">
             <div className="modal-header">
               <h3>
                 {t.details}
                 {' '}
                 <span className="finance-pill">
                   {formatCurrency(selected.total, lang)}
                 </span>
               </h3>
               <button className="close-btn" type="button" onClick={closeModal} aria-label={t.close || 'Close'}>×</button>
             </div>
             <div className="finance-cards">
               <div className="card">
                 <div className="label">{t.order}</div>
                 <div className="val">{selected.order_id}</div>
               </div>
               <div className="card">
                 <div className="label">{t.revenue}</div>
                 <div className="val">{fmt(finance?.revenue)}</div>
               </div>
               <div className="card">
                 <div className="label">{t.material}</div>
                 <div className="val">{fmt(finance?.material_cost)}</div>
               </div>
               <div className="card">
                 <div className="label">{t.labor}</div>
                 <div className="val">{fmt(finance?.labor_cost)}</div>
               </div>
               <div className="card">
                 <div className="label">{t.margin}</div>
                 <div className="val">{fmt(finance?.gross_margin)}</div>
               </div>
               <div className="card">
                 <div className="label">{t.marginPct}</div>
                 <div className="val">{fmtPct()}</div>
               </div>
             </div>
           </div>
         </ModalOverlay>
       )}
     </div>
   )
 }
