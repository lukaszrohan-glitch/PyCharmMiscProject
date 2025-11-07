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
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapRef = useRef(null)
  const listRef = useRef(null)

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

  useEffect(()=>{
    if (highlightedIndex > filtered.length - 1) setHighlightedIndex(0)
  }, [filtered, highlightedIndex])

  function handleKeyDown(e){
    if(!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){
      setOpen(true)
      return
    }
    if(e.key === 'ArrowDown'){
      e.preventDefault()
      const next = (highlightedIndex + 1) % Math.max(filtered.length, 1)
      setHighlightedIndex(next)
      scrollIntoView(next)
    } else if(e.key === 'ArrowUp'){
      e.preventDefault()
      const next = (highlightedIndex - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1)
      setHighlightedIndex(next)
      scrollIntoView(next)
    } else if(e.key === 'Enter'){
      if(open && filtered.length > 0){
        e.preventDefault()
        const it = filtered[highlightedIndex] || filtered[0]
        if(it){ onSelect(it); setOpen(false) }
      }
    } else if(e.key === 'Escape'){
      setOpen(false)
    }
  }

  function scrollIntoView(idx){
    const ul = listRef.current
    if(!ul) return
    const li = ul.querySelector(`[data-idx="${idx}"]`)
    if(li && li.scrollIntoView){ li.scrollIntoView({ block: 'nearest' }) }
  }

  return (
    <div ref={wrapRef} style={{position:'relative'}}>
      <input
        data-testid={testId}
        placeholder={placeholder}
        value={inputValue || ''}
        onFocus={()=>setOpen(true)}
        onChange={e=>{ onInputChange(e.target.value); setOpen(true) }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={testId? `${testId}-list` : undefined}
      />
      {open && filtered.length > 0 && (
        <ul
          id={testId? `${testId}-list`: undefined}
          ref={listRef}
          role="listbox"
          style={{position:'absolute', zIndex:10, background:'#fff', border:'1px solid #ddd', width:'100%', maxHeight:180, overflowY:'auto', margin:0, padding:4, listStyle:'none'}}
        >
          {filtered.map((it, idx)=>{
            const label = getLabel(it)
            const isActive = idx === highlightedIndex
            return (
              <li
                key={idx}
                data-idx={idx}
                role="option"
                aria-selected={isActive}
                style={{padding:'4px 6px', cursor:'pointer', background: isActive? '#eef6ff' : 'transparent'}}
                onMouseEnter={()=>setHighlightedIndex(idx)}
                onClick={()=>{ onSelect(it); setOpen(false) }}
                data-testid={`${testId}-option-${idx}`}
              >
                {label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
