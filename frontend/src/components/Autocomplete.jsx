import React, { useMemo, useState, useEffect, useRef } from 'react'

export default function Autocomplete({
  items = [],
  getLabel = (x)=> String(x),
  onSelect = ()=>{},
  placeholder = '',
  inputValue,
  onInputChange = ()=>{},
  testId
}){
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const filtered = useMemo(()=>{
    const q = (inputValue || '').toLowerCase()
    if(!q) return items.slice(0, 8)
    return items.filter(it => getLabel(it).toLowerCase().includes(q)).slice(0, 8)
  }, [items, inputValue])

  useEffect(()=>{
    function onDocClick(e){
      if(wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return ()=> document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <div ref={wrapRef} style={{position:'relative'}}>
      <input
        data-testid={testId}
        placeholder={placeholder}
        value={inputValue || ''}
        onFocus={()=>setOpen(true)}
        onChange={e=>{ onInputChange(e.target.value); setOpen(true) }}
      />
      {open && filtered.length > 0 && (
        <ul style={{position:'absolute', zIndex:10, background:'#fff', border:'1px solid #ddd', width:'100%', maxHeight:180, overflowY:'auto', margin:0, padding:4, listStyle:'none'}}>
          {filtered.map((it, idx)=>{
            const label = getLabel(it)
            return (
              <li key={idx} style={{padding:'4px 6px', cursor:'pointer'}} onClick={()=>{ onSelect(it); setOpen(false) }} data-testid={`${testId}-option-${idx}`}>
                {label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

