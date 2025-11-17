import React, { useEffect, useState } from 'react'
import { adminListAdminAudit, getToken } from '../services/api'

export default function AdminAudit(){
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [limit, setLimit] = useState(50)

  const token = getToken()

  async function load(){
    setErr(null)
    try{
      const data = await adminListAdminAudit(limit)
      setRows(data || [])
    }catch(e){ setErr(String(e)) }
  }

  useEffect(()=>{ if(token) load() }, [token, limit])

  if(!token){
    return <div style={{padding:12, border:'1px solid #eee', borderRadius:8}}>Login as admin to view audit.</div>
  }

  return (
    <div style={{padding:12, border:'1px solid #e5e7eb', borderRadius:8}}>
      <h3 style={{marginTop:0}}>Admin Audit</h3>
      <div style={{marginBottom:8}}>
        <label>Limit: <input type="number" min={1} max={500} value={limit} onChange={e=>setLimit(Number(e.target.value)||50)} style={{width:80}} /></label>
        <button onClick={load} style={{marginLeft:8}}>Refresh</button>
      </div>
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse', width:'100%'}}>
          <thead>
          <tr style={{background:'#f9fafb'}}>
            <th style={{textAlign:'left', padding:6}}>ID</th>
            <th style={{textAlign:'left', padding:6}}>Type</th>
            <th style={{textAlign:'left', padding:6}}>By</th>
            <th style={{textAlign:'left', padding:6}}>Time</th>
            <th style={{textAlign:'left', padding:6}}>Details</th>
          </tr>
          </thead>
          <tbody>
          {rows.map(r => (
            <tr key={r.audit_id} style={{borderBottom:'1px solid #eee'}}>
              <td style={{padding:6}}>{r.audit_id}</td>
              <td style={{padding:6}}>{r.event_type}</td>
              <td style={{padding:6}}>{r.event_by || '-'}</td>
              <td style={{padding:6}}>{r.event_time || '-'}</td>
              <td style={{padding:6}}>
                <pre style={{margin:0, whiteSpace:'pre-wrap'}}>{typeof r.details === 'string' ? r.details : JSON.stringify(r.details)}</pre>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} style={{padding:12, color:'#9ca3af'}}>No audit entries</td></tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

