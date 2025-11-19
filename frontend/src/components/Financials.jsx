import React, { useEffect, useState } from 'react'
import * as api from '../services/api'

export default function Financials({ lang, initialOrderId }){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [finance, setFinance] = useState(null)
  const [loading, setLoading] = useState(false)

  const t = lang==='pl' ? {
    title:'Finanse', select:'Wybierz zamówienie', order:'Zamówienie', revenue:'Przychód', material:'Koszt materiałów', labor:'Koszt pracy', margin:'Marża brutto'
  } : { title:'Financials', select:'Select order', order:'Order', revenue:'Revenue', material:'Material cost', labor:'Labor cost', margin:'Gross margin' }

  useEffect(()=>{ (async()=>{ try{ setOrders(await api.getOrders()||[]) }catch{}})() },[])

  // If initialOrderId is provided, preselect and load it once orders fetched
  useEffect(() => {
    if (!initialOrderId || !orders?.length) return
    const o = orders.find(x => String(x.order_id) === String(initialOrderId))
    if (o) { load(o) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId, orders])

  async function load(o){ setSelected(o); setLoading(true); try{ setFinance(await api.getFinance(o.order_id)) } catch(e){ alert(e.message) } finally{ setLoading(false) } }
  const fmt = (n)=> new Intl.NumberFormat(undefined,{style:'currency',currency:'PLN'}).format(n||0)

  return (
    <div className="financials-container">
      <div className="financials-header">
        <h2>{t.title}</h2>
        <select onChange={e=>{ const o=orders.find(x=>x.order_id===e.target.value); if(o) load(o) }} value={selected?.order_id||''}>
          <option value="">{t.select}</option>
          {orders.map(o=> <option key={o.order_id} value={o.order_id}>{o.order_id}</option>)}
        </select>
      </div>
      {selected && (
        <div className="finance-cards">
          <div className="card"><div className="label">{t.order}</div><div className="val">{selected.order_id}</div></div>
          <div className="card"><div className="label">{t.revenue}</div><div className="val">{fmt(finance?.revenue)}</div></div>
          <div className="card"><div className="label">{t.material}</div><div className="val">{fmt(finance?.material_cost)}</div></div>
          <div className="card"><div className="label">{t.labor}</div><div className="val">{fmt(finance?.labor_cost)}</div></div>
          <div className="card"><div className="label">{t.margin}</div><div className="val">{fmt(finance?.gross_margin)}</div></div>
        </div>
      )}
      <style jsx>{`
        .financials-header{ display:flex; align-items:center; gap:12px; justify-content:space-between; margin-bottom:10px }
        .finance-cards{ display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:10px }
        .card{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:12px }
        .label{ font-size:12px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.06em }
        .val{ font-size:18px; font-weight:700 }
      `}</style>
    </div>
  )
}

