import { useCallback, useEffect, useState } from 'react'
import * as api from '../services/api'
import { useToast } from '../lib/toastContext'

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
        <div className="finance-cards" role="group" aria-label={lang==='pl'?'Metryki finansowe':'Financial metrics'}>
         <div className="finance-card">
           <div className="finance-card-label">{t.order}</div>
           <div className="finance-card-value">{selected.order_id}</div>
         </div>
         <div className="finance-card">
           <div className="finance-card-label">{t.revenue}</div>
           <div className="finance-card-value">{fmt(finance?.revenue)}</div>
         </div>
         <div className="finance-card">
           <div className="finance-card-label">{t.material}</div>
           <div className="finance-card-value">{fmt(finance?.material_cost)}</div>
         </div>
         <div className="finance-card">
           <div className="finance-card-label">{t.labor}</div>
           <div className="finance-card-value">{fmt(finance?.labor_cost)}</div>
         </div>
         <div className="finance-card">
           <div className="finance-card-label">{t.margin}</div>
           <div className="finance-card-value">{fmt(finance?.gross_margin)}</div>
         </div>
         <div className="finance-card">
           <div className="finance-card-label">{t.marginPct}</div>
           <div className="finance-card-value">{fmtPct()}</div>
         </div>
        </div>
      )}
   </div>
 )
}
