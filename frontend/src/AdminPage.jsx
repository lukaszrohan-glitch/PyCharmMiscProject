import React, { useEffect, useState } from 'react'
import { adminListKeys, adminCreateKey, adminDeleteKey, adminRotateKey, setAdminKey } from './services/api'
import { useToast } from './components/Toast'

export default function AdminPage({ onClose }){
  const [keys, setKeys] = useState([])
  const [label, setLabel] = useState('')
  const [adminKeyInput, setAdminKeyInput] = useState('')
  const [lastKey, setLastKey] = useState(null)
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

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
      toast.show('API key created')
      await refresh()
    }catch(e){ setErr(String(e)) }
  }

  async function deleteKey(id){
    if(!confirm('Delete API key id '+id+'?')) return
    try{ await adminDeleteKey(id); setMsg('Deleted'); await refresh(); toast.show('API key deleted') }catch(e){ setErr(String(e)); toast.show('Delete failed','error') }
  }

  async function rotateKey(id){
    if(!confirm('Rotate API key id '+id+'? This will deactivate the old key and create a new one.')) return
    try{ const r = await adminRotateKey(id); setLastKey(r.api_key || null); setMsg('Rotated'); toast.show('API key rotated'); await refresh() }catch(e){ setErr(String(e)); toast.show('Rotate failed','error') }
  }

  useEffect(()=>{ refresh() }, [])

  return (
    <div style={{padding:12, border:'1px solid #e1e4e8', borderRadius:8, background:'#fafbfc'}}>
      <h2>Admin</h2>
      <div style={{marginBottom:8}}>
        <input placeholder="Admin key" value={adminKeyInput} onChange={e=>setAdminKeyInput(e.target.value)} />
        <button onClick={refresh}>Refresh</button>
        <button onClick={onClose} style={{marginLeft:8}}>Close</button>
      </div>
      <div style={{marginBottom:8}}>
        <form onSubmit={createKey} style={{display:'flex', gap:8}}>
          <input placeholder="New key label" value={label} onChange={e=>setLabel(e.target.value)} />
          <button type="submit">Create</button>
        </form>
        {lastKey && (
          <div style={{marginTop:8, padding:8, background:'#fff', border:'1px dashed #6c6c6c', borderRadius:6}} title="Click to copy" onClick={()=>{navigator.clipboard.writeText(lastKey); toast.show('Copied new key')}}>
            <strong>New key (copy now):</strong>
            <div style={{marginTop:4}}><code>{lastKey}</code></div>
          </div>
        )}
      </div>
      {msg && <div style={{color:'green'}}>{msg}</div>}
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <h3>Existing keys</h3>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse', width:'100%'}}>
          <thead>
            <tr style={{background:'#f0f2f4'}}>
              <th style={{textAlign:'left', padding:'6px'}}>ID</th>
              <th style={{textAlign:'left', padding:'6px'}}>Label</th>
              <th style={{textAlign:'left', padding:'6px'}}>Status</th>
              <th style={{textAlign:'left', padding:'6px'}}>Created</th>
              <th style={{textAlign:'left', padding:'6px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} style={{borderBottom:'1px solid #e1e4e8'}}>
                <td style={{padding:'6px'}}>{k.id}</td>
                <td style={{padding:'6px'}}>{k.label || <em style={{color:'#888'}}>—</em>}</td>
                <td style={{padding:'6px'}}><span style={{display:'inline-block', padding:'2px 6px', borderRadius:12, background: k.active? '#dcfce7':'#ffe2e2', fontSize:12}}>{k.active? 'active':'inactive'}</span></td>
                <td style={{padding:'6px'}}>{k.created_at || ''}</td>
                <td style={{padding:'6px'}}>
                  <button onClick={()=>rotateKey(k.id)}>Rotate</button>
                  <button style={{marginLeft:6}} onClick={()=>deleteKey(k.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
