import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext({ show: ()=>{} })

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const show = useCallback((msg, kind='success')=>{
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, kind }])
    setTimeout(()=> setToasts(t=> t.filter(x=>x.id!==id)), 3000)
  }, [])
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div style={{position:'fixed', top:10, right:10, display:'flex', flexDirection:'column', gap:6}}>
        {toasts.map(t=> (
          <div key={t.id} style={{background: t.kind==='error'?'#ffebe9':'#e6ffed', color:'#222', border:'1px solid #ccc', borderRadius:6, padding:'8px 10px', minWidth:200}}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast(){
  return useContext(ToastCtx)
}

