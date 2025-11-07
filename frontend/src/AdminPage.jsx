import React, { useEffect, useState } from 'react'
import { adminListKeys, adminCreateKey, adminDeleteKey, adminRotateKey, setAdminKey } from './services/api'

export default function AdminPage({ onClose }){
  const [keys, setKeys] = useState([])
  const [label, setLabel] = useState('')
  const [adminKeyInput, setAdminKeyInput] = useState('')
  const [lastKey, setLastKey] = useState(null)
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(()=>{
    if(adminKeyInput) setAdminKey(adminKeyInput)
  }, [adminKeyInput])

  async function refresh(){
    setErr(null)
    try{
      const rows = await adminListKeys()
      setKeys(rows)
    }catch(e){ setErr(String(e)) }
  }

  async function createKey(e){
    e.preventDefault(); setErr(null); setMsg(null)
    try{
      const r = await adminCreateKey({ label })
      setLastKey(r.api_key || null)
      setLabel('')
      setMsg('Created')
      await refresh()
    }catch(e){ setErr(String(e)) }
  }

  async function deleteKey(id){
    if(!confirm('Delete API key id '+id+'?')) return
    try{ await adminDeleteKey(id); setMsg('Deleted'); await refresh() }catch(e){ setErr(String(e)) }
  }

  async function rotateKey(id){
    if(!confirm('Rotate API key id '+id+'? This will deactivate the old key and create a new one.')) return
    try{ const r = await adminRotateKey(id); setLastKey(r.api_key || null); setMsg('Rotated'); await refresh() }catch(e){ setErr(String(e)) }
  }

  useEffect(()=>{ refresh() }, [])

  return (
    <div style={{padding:12}}>
      <h2>Admin</h2>
      <div style={{marginBottom:8}}>
        <input placeholder="Admin key" value={adminKeyInput} onChange={e=>setAdminKeyInput(e.target.value)} />
        <button onClick={refresh}>Refresh</button>
        <button onClick={onClose} style={{marginLeft:8}}>Close</button>
      </div>
      <div style={{marginBottom:8}}>
        <form onSubmit={createKey}>
          <input placeholder="New key label" value={label} onChange={e=>setLabel(e.target.value)} />
          <button type="submit">Create</button>
        </form>
        {lastKey && (
          <div style={{marginTop:8}}>
            <strong>New key:</strong> <code>{lastKey}</code>
            <button onClick={()=>navigator.clipboard.writeText(lastKey)} style={{marginLeft:8}}>Copy</button>
          </div>
        )}
      </div>
      {msg && <div style={{color:'green'}}>{msg}</div>}
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <h3>Existing keys</h3>
      <ul>
        {keys.map(k => (
          <li key={k.id} style={{marginBottom:6}}>
            ID {k.id} — {k.label} — {k.active ? 'active' : 'inactive'}
            <button style={{marginLeft:8}} onClick={()=>rotateKey(k.id)}>Rotate</button>
            <button style={{marginLeft:8}} onClick={()=>deleteKey(k.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

