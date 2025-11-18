import React from 'react'

function getMonthDays(year, month) {
  // month: 0-11
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay() // 0=Sun
  const weeks = []
  let currentWeek = Array((startWeekday + 6) % 7 + 1).fill(null) // align Mon=0
  // Adjust to Monday-start calendar
  const offset = (startWeekday + 6) % 7
  currentWeek = Array(offset).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const weekday = (date.getDay() + 6) % 7 // Monday=0
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(date)
    if (weekday === 6) {
      if (currentWeek.length < 7) currentWeek.push(...Array(7 - currentWeek.length).fill(null))
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length) {
    currentWeek.push(...Array(7 - currentWeek.length).fill(null))
    weeks.push(currentWeek)
  }
  return weeks
}

function fmtLocal(date){
  const y = date.getFullYear();
  const m = (date.getMonth()+1).toString().padStart(2,'0');
  const d = date.getDate().toString().padStart(2,'0');
  return `${y}-${m}-${d}`;
}

export default function Calendar({ year, month, selectedDate, onSelectDate, totalsByDate = {}, lang }) {
  const weeks = getMonthDays(year, month)
  const todayStr = new Date().toISOString().slice(0,10)
  const locale = lang === 'pl' ? 'pl-PL' : undefined
  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, { month:'long', year:'numeric' })
  const dayLabels = Array.from({length:7}).map((_,i)=>{
    const d = new Date(2020, 5, 1 + i) // arbitrary week
    // Convert to Monday-first
    const weekday = (d.getDay() + 6) % 7
    const ref = new Date(2020, 5, 1 + weekday)
    return ref.toLocaleDateString(locale, { weekday:'short' })
  })

  const fmt = (date) => fmtLocal(date)

  return (
    <div className="calendar">
      <div className="cal-month" style={{fontWeight:700, margin:'4px 0 6px'}}>{monthLabel}</div>
      <div className="calendar-grid">
        {dayLabels.map(d => (
          <div key={d} className="cal-header">{d}</div>
        ))}
        {weeks.map((week, i) => {
          // compute weekly total
          let weekTotal = 0
          week.forEach(d => { if (d) { const ds = fmt(d); if (totalsByDate[ds] != null) weekTotal += Number(totalsByDate[ds]) } })
          return week.map((date, j) => {
            if (!date) return <div key={`${i}-${j}`} className="cal-cell empty" />
            const ds = fmt(date)
            const isSelected = selectedDate === ds
            const isToday = todayStr === ds
            const total = totalsByDate[ds]
            return (
              <button
                key={`${i}-${j}`}
                className={`cal-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => onSelectDate && onSelectDate(ds)}
                title={total ? `${ds}: ${total}h` : ds}
              >
                <div className="cal-date">{date.getDate()}</div>
                {total != null && (
                  <div
                    className="cal-total"
                    style={ total > 8 ? { background:'#d97706' } : undefined }
                  >{total}h</div>
                )}
                {j === 6 && (
                  <div className="cal-week-total">Σ {weekTotal}h</div>
                )}
              </button>
            )
          })
        })}
      </div>
    </div>
  )
}
