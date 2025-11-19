import React, { useEffect, useMemo, useState } from 'react'
import * as api from '../services/api'

function BarChart({ data=[], height=140, color='#0071e3', label }){
  const max = Math.max(1, ...data.map(d=>d.v))
  const w = Math.max(240, data.length*18)
  const barW = Math.floor((w - (data.length+1)*6)/data.length)
  return (
    <svg width={w} height={height} role="img" aria-label={label}>
      {data.map((d,i)=>{
        const h = Math.round((d.v/max)*(height-20))
        const x = 6 + i*(barW+6)
        const y = height - h - 16
        return <g key={i}>
          <rect x={x} y={y} width={barW} height={h} rx="4" fill={color} />
          <text x={x+barW/2} y={height-4} fontSize="10" textAnchor="middle" fill="#6e6e73">{d.k}</text>
        </g>
      })}
    </svg>
  )
}

export default function Reports({ lang }){
  const [timesheets, setTimesheets] = useState([])
  const [employees, setEmployees] = useState([])
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [summary, setSummary] = useState(null)
  const [revByMonth, setRevByMonth] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [topOrders, setTopOrders] = useState([])

  const [range, setRange] = useState('90d')

  useEffect(()=>{ (async()=>{
    try{ setTimesheets(await api.getTimesheets()||[]) }catch{}
    try{ setEmployees(await api.getEmployees()||[]) }catch{}
    try{ setInventory(await api.getInventory()||[]) }catch{}
    try{ setProducts(await api.getProducts()||[]) }catch{}
  })() },[])

  useEffect(() => {
    ;(async () => {
      try {
        const params = {}
        const now = new Date()
        if (range === '30d' || range === '90d' || range === '365d') {
          const days = range === '30d' ? 30 : range === '90d' ? 90 : 365
          const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          params.date_from = from.toISOString().slice(0, 10)
          params.date_to = now.toISOString().slice(0, 10)
        }
        const [sum, rbm, tc, to] = await Promise.all([
          api.getAnalyticsSummary(params),
          api.getRevenueByMonth(),
          api.getTopCustomers(params),
          api.getTopOrders(params),
        ])
        setSummary(sum || null)
        setRevByMonth(rbm || [])
        setTopCustomers(tc || [])
        setTopOrders(to || [])
      } catch {
        // keep reports best-effort, no hard fail
      }
    })()
  }, [range])

  const empMap = useMemo(()=>{
    const m = new Map(); employees.forEach(e=>m.set(String(e.emp_id), e)); return m
  }, [employees])

  const dailyHours = useMemo(()=>{
    const m = new Map()
    timesheets.forEach(t=>{ const k=t.ts_date?.slice(5); m.set(k,(m.get(k)||0)+Number(t.hours||0)) })
    return Array.from(m, ([k,v])=>({k,v})).slice(-14)
  }, [timesheets])

  const timesheetsValue = useMemo(()=>{
    let val = 0
    timesheets.forEach(t=>{ const e=empMap.get(String(t.emp_id)); const rate = Number(e?.hourly_rate||0); val += Number(t.hours||0)*rate })
    return val
  },[timesheets, empMap])

  const stockValue = useMemo(()=>{
    const price = new Map(); products.forEach(p=>price.set(String(p.product_id), Number(p.std_cost||0)))
    const qty = new Map(); inventory.forEach(i=>{ const id=String(i.product_id); qty.set(id,(qty.get(id)||0)+Number(i.qty_change||0)) })
    let total = 0; qty.forEach((q,id)=>{ total += q * (price.get(id)||0) })
    return total
  },[products, inventory])

  const t = lang==='pl' ? {
    title:'Raporty',
    th:'Godziny (14 dni)',
    tv:'Wartość czasu pracy',
    sv:'Wartość magazynu',
    fv:'Kluczowe finanse',
    rev:'Przychód',
    margin:'Marża',
    marginPct:'Marża %',
    yoy:'Zmiana przychodu vs poprzedni okres',
    topCustomer:'Top klient',
    revenueByMonth:'Przychód wg miesięcy',
    customers:'Top klienci',
    orders:'Top zlecenia',
    range30:'30 dni',
    range90:'90 dni',
    range365:'Rok'
  } : {
    title:'Reports',
    th:'Hours (14 days)',
    tv:'Timesheets value',
    sv:'Stock value',
    fv:'Key financials',
    rev:'Revenue',
    margin:'Margin',
    marginPct:'Margin %',
    yoy:'Revenue change vs previous period',
    topCustomer:'Top customer',
    revenueByMonth:'Revenue by month',
    customers:'Top customers',
    orders:'Top orders',
    range30:'30 days',
    range90:'90 days',
    range365:'Year'
  }

  const fmt = (n)=> new Intl.NumberFormat(undefined,{ style:'currency', currency:'PLN' }).format(n||0)
  const fmtPct = (n)=> n == null ? '–' : `${(Number(n) * 100).toFixed(1)}%`

  const kpi = summary || {}

  return (
    <div className="reports">
      <h2>{t.title}</h2>

      <div className="kpi-range">
        <div className="range-buttons">
          <button className={range==='30d' ? 'active' : ''} onClick={() => setRange('30d')}>{t.range30}</button>
          <button className={range==='90d' ? 'active' : ''} onClick={() => setRange('90d')}>{t.range90}</button>
          <button className={range==='365d' ? 'active' : ''} onClick={() => setRange('365d')}>{t.range365}</button>
        </div>
      </div>

      <div className="kpi-cards">
        <div className="card">
          <div className="card-title">{t.rev}</div>
          <div className="metric">{fmt(kpi.total_revenue)}</div>
        </div>
        <div className="card">
          <div className="card-title">{t.margin}</div>
          <div className="metric">{fmt(kpi.total_margin)}</div>
          <div className="metric-sub">{t.marginPct}: {fmtPct(kpi.margin_pct)}</div>
        </div>
        <div className="card">
          <div className="card-title">{t.yoy}</div>
          <div className="metric-sub">{fmtPct(kpi.revenue_yoy_change_pct)}</div>
        </div>
        <div className="card">
          <div className="card-title">{t.topCustomer}</div>
          {kpi.top_customer ? (
            <>
              <div className="metric-sub">{kpi.top_customer.name || kpi.top_customer.customer_id}</div>
              <div className="metric-sub">{fmt(kpi.top_customer.revenue)}</div>
            </>
          ) : <div className="metric-sub">–</div>}
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-title">{t.th}</div>
          <BarChart data={dailyHours.map(d=>({k:d.k?.slice(-5), v:d.v}))} color="#0071e3" />
        </div>
        <div className="card">
          <div className="card-title">{t.tv}</div>
          <div className="metric">{fmt(timesheetsValue)}</div>
        </div>
        <div className="card">
          <div className="card-title">{t.sv}</div>
          <div className="metric">{fmt(stockValue)}</div>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-title">{t.revenueByMonth}</div>
          <BarChart
            data={revByMonth.map(m => ({ k: String(m.month).slice(5, 7), v: Number(m.revenue || 0) }))}
            color="#10b981"
          />
        </div>
        <div className="card">
          <div className="card-title">{t.customers}</div>
          <table className="mini-table">
            <thead>
              <tr><th>Klient</th><th>{t.rev}</th><th>{t.marginPct}</th></tr>
            </thead>
            <tbody>
              {(topCustomers || []).map(c => (
                <tr key={c.customer_id}>
                  <td>{c.name || c.customer_id}</td>
                  <td>{fmt(c.revenue)}</td>
                  <td>{fmtPct(c.margin_pct || (c.revenue ? (c.margin / c.revenue) : null))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">{t.orders}</div>
          <table className="mini-table">
            <thead>
              <tr><th>Zlecenie</th><th>Klient</th><th>{t.rev}</th></tr>
            </thead>
            <tbody>
              {(topOrders || []).map(o => (
                <tr key={o.order_id}>
                  <td>{o.order_id}</td>
                  <td>{o.customer_name || o.customer_id}</td>
                  <td>{fmt(o.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .kpi-range{ display:flex; justify-content:flex-end; margin-bottom:8px; }
        .range-buttons button{ margin-left:4px; padding:4px 10px; border-radius:999px; border:1px solid var(--border); background:var(--surface); cursor:pointer; font-size:12px; }
        .range-buttons button.active{ background:#111827; color:#fff; border-color:#111827; }
        .kpi-cards{ display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:16px; }
        .cards{ display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:16px; margin-bottom:16px; }
        .card{ background: var(--surface); border:1px solid var(--border); border-radius:16px; padding:14px; }
        .card-title{ color:#6e6e73; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px; }
        .metric{ font-size:24px; font-weight:700; color:var(--text); }
        .metric-sub{ font-size:13px; color:#6e6e73; margin-top:4px; }
        .mini-table{ width:100%; border-collapse:collapse; font-size:12px; }
        .mini-table th{ text-align:left; padding:4px 2px; color:#6e6e73; font-weight:600; }
        .mini-table td{ padding:4px 2px; border-top:1px solid var(--border); }
      `}</style>
    </div>
  )
}
