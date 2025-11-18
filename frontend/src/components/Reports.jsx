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

  useEffect(()=>{ (async()=>{
    try{
      setTimesheets(await api.getTimesheets()||[])
    }catch{}
    try{ setEmployees(await api.getEmployees()||[]) }catch{}
    try{ setInventory(await api.getInventory()||[]) }catch{}
    try{ setProducts(await api.getProducts()||[]) }catch{}
  })() },[])

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

  const t = lang==='pl' ? { title:'Raporty', th:'Godziny (14 dni)', tv:'Wartość czasu pracy', sv:'Wartość magazynu', fv:'Kluczowe finanse' } :
    { title:'Reports', th:'Hours (14 days)', tv:'Timesheets value', sv:'Stock value', fv:'Key Financials' }

  const fmt = (n)=> new Intl.NumberFormat(undefined,{ style:'currency', currency:'PLN' }).format(n||0)

  return (
    <div className="reports">
      <h2>{t.title}</h2>
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

      <style jsx>{`
        .cards{ display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
        .card{ background: var(--surface); border:1px solid var(--border); border-radius:16px; padding:14px; }
        .card-title{ color:#6e6e73; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px; }
        .metric{ font-size:28px; font-weight:700; color:var(--text); }
      `}</style>
    </div>
  )
}

