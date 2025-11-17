import React, { useState } from 'react'
import { adminImportCSV, getToken } from '../services/api'

export default function AdminImport(){
  const [entity, setEntity] = useState('products')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState(null)

  const token = getToken()

  const submit = async (e) => {
    e.preventDefault()
    setErr(null); setResult(null)
    if(!file){ setErr('Choose a CSV file'); return }
    try{
      setBusy(true)
      const r = await adminImportCSV(entity, file)
      setResult(r)
    }catch(e){ setErr(String(e)) }
    finally{ setBusy(false) }
  }

  if(!token){
    return <div style={{padding:12, border:'1px solid #eee', borderRadius:8}}>Login as admin to import CSV.</div>
  }

  return (
    <div style={{padding:12, border:'1px solid #e5e7eb', borderRadius:8}}>
      <h3 style={{marginTop:0}}>Admin Import (CSV)</h3>
      <form onSubmit={submit} style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <label>
          Entity:
          <select value={entity} onChange={(e)=>setEntity(e.target.value)} style={{marginLeft:8}}>
            <option value="orders">orders</option>
            <option value="products">products</option>
            <option value="customers">customers</option>
            <option value="employees">employees</option>
            <option value="timesheets">timesheets</option>
            <option value="inventory">inventory</option>
          </select>
        </label>
        <input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <button type="submit" disabled={busy || !file}>{busy ? 'Importing…' : 'Import'}</button>
      </form>
      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}
      {result && (
        <div style={{marginTop:8, color:'#065f46'}}>
          Imported: <strong>{result.imported}</strong> rows for <code>{result.entity_type}</code>
        </div>
      )}
      <div style={{marginTop:8, fontSize:12, color:'#6b7280'}}>
        CSV must include headers matching API fields.
      </div>
    </div>
  )
}

