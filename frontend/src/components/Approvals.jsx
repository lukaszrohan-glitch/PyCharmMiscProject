import React, { useEffect, useMemo, useState } from 'react'
import * as api from '../services/api'

function fmtLocal(d){
  const dd = new Date(d)
  const y = dd.getFullYear();
  const m = (dd.getMonth()+1).toString().padStart(2,'0');
  const day = dd.getDate().toString().padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function isoWeekInfo(dateStr){
  const d = new Date(dateStr + 'T00:00:00')
  const tmp = new Date(d)
  // ISO week starts Monday; set to nearest Thursday
  const day = (tmp.getDay() + 6) % 7 // Mon=0..Sun=6
  tmp.setDate(tmp.getDate() + (3 - day))
  const isoYear = tmp.getFullYear()
  const jan4 = new Date(isoYear, 0, 4)
  const startOfISOYear = new Date(jan4)
  const jan4Day = (jan4.getDay() + 6) % 7
  startOfISOYear.setDate(jan4.getDate() - jan4Day)
  const week = Math.floor((tmp - startOfISOYear) / (7 * 24 * 3600 * 1000)) + 1
  // Monday of the week
  const monday = new Date(d)
  const weekday = (d.getDay() + 6) % 7
  monday.setDate(d.getDate() - weekday)
  return { year: isoYear, week: String(week).padStart(2,'0'), week_start: fmtLocal(monday), week_label: `${isoYear}-W${String(week).padStart(2,'0')}` }
}

export default function Approvals(){
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])
  const [filterEmpId, setFilterEmpId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showApprovedWeekly, setShowApprovedWeekly] = useState(false)
  const [approvedRows, setApprovedRows] = useState([])

  async function load(){
    try{
      setLoading(true)
      const data = await api.getPendingTimesheets({ fromDate: fromDate || undefined, toDate: toDate || undefined, empId: filterEmpId || undefined })
      setRows(data || [])
      setSelected({})
    }catch(e){ setError(String(e)) }
    finally{ setLoading(false) }
  }

  async function loadEmployees(){
    try{
      const data = await api.getEmployees()
      setEmployees(data || [])
    }catch(e){ /* ignore */ }
  }

  useEffect(()=>{ load(); loadEmployees() }, [])

  useEffect(()=>{
    (async () => {
      if (showApprovedWeekly){
        try{
          setLoading(true)
          const data = await api.getTimesheetsFiltered({ fromDate: fromDate || undefined, toDate: toDate || undefined, empId: filterEmpId || undefined, approved: true })
          setApprovedRows(data || [])
        }catch(e){ /* ignore */ }
        finally{ setLoading(false) }
      }
    })()
  }, [showApprovedWeekly, fromDate, toDate, filterEmpId])

  const weekly = useMemo(()=>{
    const source = showApprovedWeekly ? approvedRows : rows
    const map = new Map()
    for (const r of source){
      const info = isoWeekInfo(r.ts_date)
      const key = info.week_label
      if (!map.has(key)) map.set(key, { ...info, rows: [], total_hours: 0 })
      const g = map.get(key)
      g.rows.push(r)
      g.total_hours += Number(r.hours || 0)
    }
    return Array.from(map.values()).sort((a,b)=> a.week_start.localeCompare(b.week_start))
  }, [rows, approvedRows, showApprovedWeekly])

  async function approveSelected(){
    const ids = Object.keys(selected).filter(k => selected[k]).map(Number)
    if (ids.length === 0) return
    if (!confirm(`Approve ${ids.length} entries?`)) return
    try{
      setLoading(true)
      for (const id of ids){
        // eslint-disable-next-line no-await-in-loop
        await api.approveTimesheet(id)
      }
      await load()
      alert('Approved')
    }catch(e){
      alert('Approval failed: ' + e.message)
    }finally{ setLoading(false) }
  }

  async function exportPending(){
    try{
      const blob = await api.exportTimesheetsCSV({ fromDate: fromDate || undefined, toDate: toDate || undefined, empId: filterEmpId || undefined, pending: true })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const name = `pending_${fromDate || ''}_${toDate || ''}${filterEmpId?`_${filterEmpId}`:''}.csv`.replace(/__+/g,'_')
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }catch(e){
      alert('Export failed: ' + e.message)
    }
  }

  async function approveWeek(info){
    if (!confirm(`Approve all pending entries for ${info.week_label}?`)) return
    try{
      setLoading(true)
      for (const r of info.rows){
        // eslint-disable-next-line no-await-in-loop
        await api.approveTimesheet(r.ts_id)
      }
      await load()
      alert('Approved')
    }catch(e){
      alert('Approval failed: ' + e.message)
    }finally{ setLoading(false) }
  }

  return (
    <div style={{ padding: 8, border: '1px solid #e1e4e8', borderRadius: 6, background: '#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
        <h3 style={{ marginRight: 'auto' }}>Pending Approvals</h3>
        <select value={filterEmpId} onChange={e=> setFilterEmpId(e.target.value)}>
          <option value="">All employees</option>
          {employees.map(e => (
            <option key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={e=> setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={e=> setToDate(e.target.value)} />
        <label style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
          <input type="checkbox" checked={showApprovedWeekly} onChange={e=> setShowApprovedWeekly(e.target.checked)} />
          Approved weekly
        </label>
        <button onClick={load} disabled={loading}>Apply</button>
        <button onClick={exportPending} disabled={loading}>Export Pending CSV</button>
        <button onClick={approveSelected} disabled={loading}>Approve Selected</button>
      </div>
      {error && <div style={{ color:'crimson', marginTop: 6 }}>{error}</div>}

      {/* Weekly summary with mode badge */}
      {weekly.length > 0 && (
        <div style={{ marginTop: 8, padding: 8, border:'1px solid #eee', borderRadius: 6, background:'#fafafa' }}>
          <strong>{showApprovedWeekly ? 'Weekly approved' : 'Weekly pending'}</strong>
          <ul>
            {weekly.map(w => (
              <li key={w.week_label} style={{ marginTop: 4 }}>
                {w.week_label} — {w.total_hours}h — {w.rows.length} entries
                {!showApprovedWeekly && (
                  <>
                    <button className="btn" style={{ marginLeft: 8 }} onClick={()=>approveWeek(w)} disabled={loading}>Approve Week</button>
                    <button className="btn" style={{ marginLeft: 8 }} onClick={()=>{
                      const sel = {}
                      for (const r of w.rows) sel[r.ts_id] = true
                      setSelected(prev => ({ ...prev, ...sel }))
                    }}>Select Week</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ overflowX:'auto', marginTop: 8 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={e=>{
                const v = e.target.checked
                const all = {}
                for(const r of rows) all[r.ts_id] = v
                setSelected(all)
              }}/></th>
              <th>TS ID</th>
              <th>Date</th>
              <th>Employee</th>
              <th>Order</th>
              <th>Operation</th>
              <th>Hours</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.ts_id}>
                <td><input type="checkbox" checked={!!selected[r.ts_id]} onChange={e=> setSelected(prev => ({ ...prev, [r.ts_id]: e.target.checked }))} /></td>
                <td>{r.ts_id}</td>
                <td>{r.ts_date}</td>
                <td>{r.emp_id}</td>
                <td>{r.order_id || '—'}</td>
                <td>{r.operation_no || '—'}</td>
                <td>{r.hours}</td>
                <td>{r.notes || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign:'center', color:'#888' }}>No pending items</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
