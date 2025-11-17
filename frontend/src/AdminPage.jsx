import React, { useEffect, useState } from 'react'
import { adminListKeys, adminCreateKey, adminDeleteKey, adminRotateKey, setAdminKey } from './services/api'
import { useToast } from './components/Toast'
import { useI18n } from './i18n.jsx'
import AdminImport from './components/AdminImport'
import AdminAudit from './components/AdminAudit'
import Approvals from './components/Approvals'

export default function AdminPage({ onClose }){
  const { t } = useI18n()
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
      setMsg(t('created_msg'))
      toast.show(t('api_key_created'))
      await refresh()
    }catch(e){ setErr(String(e)) }
  }

  async function deleteKey(id){
    if(!confirm(t('delete_key_confirm').replace('{id}', id))) return
    try{
      await adminDeleteKey(id)
      setMsg(t('deleted_msg'))
      await refresh()
      toast.show(t('api_key_deleted'))
    }catch(e){
      setErr(String(e))
      toast.show(t('api_key_delete_failed'),'error')
    }
  }

  async function rotateKey(id){
    if(!confirm(t('rotate_key_confirm').replace('{id}', id))) return
    try{
      const r = await adminRotateKey(id)
      setLastKey(r.api_key || null)
      setMsg(t('rotated_msg'))
      toast.show(t('api_key_rotated'))
      await refresh()
    }catch(e){
      setErr(String(e))
      toast.show(t('api_key_rotate_failed'),'error')
    }
  }

  useEffect(()=>{ refresh() }, [])

  return (
    <div style={{padding:12, border:'1px solid #e1e4e8', borderRadius:8, background:'#fafbfc'}}>
      <h2>{t('admin')}</h2>
      <div style={{marginBottom:8}}>
        <input placeholder={t('admin_key')} value={adminKeyInput} onChange={e=>setAdminKeyInput(e.target.value)} />
        <button onClick={refresh}>{t('refresh')}</button>
        <button onClick={onClose} style={{marginLeft:8}}>{t('close')}</button>
      </div>
      <div style={{marginBottom:8}}>
        <form onSubmit={createKey} style={{display:'flex', gap:8}}>
          <input placeholder={t('new_key_label_placeholder')} value={label} onChange={e=>setLabel(e.target.value)} />
          <button type="submit">{t('create')}</button>
        </form>
        {lastKey && (
          <div style={{marginTop:8, padding:8, background:'#fff', border:'1px dashed #6c6c6c', borderRadius:6}} title="Click to copy" onClick={()=>{navigator.clipboard.writeText(lastKey); toast.show(t('copied_new_key'))}}>
            <strong>{t('new_key_once')}</strong>
            <div style={{marginTop:4}}><code>{lastKey}</code></div>
          </div>
        )}
      </div>
      {msg && <div style={{color:'green'}}>{msg}</div>}
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <h3>{t('existing_keys')}</h3>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse', width:'100%'}}>
          <thead>
            <tr style={{background:'#f0f2f4'}}>
              <th style={{textAlign:'left', padding:'6px'}}>{t('id')}</th>
              <th style={{textAlign:'left', padding:'6px'}}>{t('label')}</th>
              <th style={{textAlign:'left', padding:'6px'}}>{t('status')}</th>
              <th style={{textAlign:'left', padding:'6px'}}>{t('created')}</th>
              <th style={{textAlign:'left', padding:'6px'}}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} style={{borderBottom:'1px solid #e1e4e8'}}>
                <td style={{padding:'6px'}}>{k.id}</td>
                <td style={{padding:'6px'}}>{k.label || <em style={{color:'#888'}}>—</em>}</td>
                <td style={{padding:'6px'}}><span style={{display:'inline-block', padding:'2px 6px', borderRadius:12, background: k.active? '#dcfce7':'#ffe2e2', fontSize:12}}>{k.active? t('active'):t('inactive')}</span></td>
                <td style={{padding:'6px'}}>{k.created_at || ''}</td>
                <td style={{padding:'6px'}}>
                  <button onClick={()=>rotateKey(k.id)}>{t('rotate')}</button>
                  <button style={{marginLeft:6}} onClick={()=>deleteKey(k.id)}>{t('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:16}}>
        <AdminImport />
      </div>
      <div style={{marginTop:16}}>
        <AdminAudit />
      </div>
      <div style={{marginTop:16}}>
        <Approvals />
      </div>
    </div>
  )
}
