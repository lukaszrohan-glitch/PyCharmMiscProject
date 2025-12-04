import { useEffect, useState, useMemo } from 'react'
import { v4 as uuid } from 'uuid'
import * as api from '../services/api'
import styles from './DemandPlanner.module.css'

const defaultScenario = {
  id: 'custom',
  name: 'Scenario ręczne',
  multiplier: 1,
  backlogWeeks: 4
}

export default function DemandPlanner({ lang = 'pl' }) {
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(defaultScenario)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ id: null, name: '', multiplier: 1, backlogWeeks: 4 })
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('demandHistory') || '[]')
    } catch {
      return []
    }
  })

  const labels = useMemo(() => ({
    pl: {
      title: 'Scenariusze popytu',
      multiplier: 'Mnożnik popytu',
      backlog: 'Backlog (tyg.)',
      run: 'Przelicz',
      revenue: 'Przychód prognozowany',
      capacity: 'Wykorzystanie mocy',
      notice: 'Wybierz scenariusz aby porównać',
      cards: ['Zlecenia / tydzień', 'Potrzebne godziny', 'Dostępne zasoby'],
      addScenario: 'Scenariusze zapisane',
      base: 'Bazowy',
      name: 'Nazwa scenariusza',
      save: 'Zapisz scenariusz',
      update: 'Aktualizuj',
      delete: 'Usuń',
      historyTitle: 'Ostatnie prognozy'
    },
    en: {
      title: 'Demand Scenarios',
      multiplier: 'Demand multiplier',
      backlog: 'Backlog (weeks)',
      run: 'Run forecast',
      revenue: 'Projected revenue',
      capacity: 'Capacity usage',
      notice: 'Pick a scenario to compare',
      cards: ['Orders / week', 'Required hours', 'Available capacity'],
      addScenario: 'Saved scenarios',
      base: 'Base',
      name: 'Scenario name',
      save: 'Save scenario',
      update: 'Update',
      delete: 'Delete',
      historyTitle: 'Recent runs'
    }
  }), [])

  const l = lang === 'en' ? labels.en : labels.pl

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getDemandScenarios()
        if (!data.length) {
          const fallback = JSON.parse(localStorage.getItem('localScenarios') || '[]')
          setScenarios([defaultScenario, ...fallback])
        } else {
          setScenarios([defaultScenario, ...data])
        }
      } catch (err) {
        const fallback = JSON.parse(localStorage.getItem('localScenarios') || '[]')
        setScenarios([defaultScenario, ...fallback])
        setError(err?.message || 'Nie udało się pobrać scenariuszy')
      }
    }
    load()
  }, [])

  const handleScenarioChange = (scenarioId) => {
    const scenario = scenarios.find((s) => s.id === scenarioId) || defaultScenario
    setSelected(scenario)
    if (scenario.id !== 'custom') {
      setForm({
        id: scenario.id,
        name: scenario.name,
        multiplier: scenario.multiplier,
        backlogWeeks: scenario.backlogWeeks
      })
    } else {
      setForm({ id: null, name: '', multiplier: scenario.multiplier, backlogWeeks: scenario.backlogWeeks })
    }
  }

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = { multiplier: selected.multiplier, backlogWeeks: selected.backlogWeeks, scenarioId: selected.id !== 'custom' ? selected.id : undefined }
      const result = await api.runDemandForecast(payload)
      setForecast(result)
      const entry = {
        id: uuid(),
        scenarioName: selected.name,
        revenue: result.revenue,
        capacity: result.capacity_usage || result.capacityUsage,
        metrics: result.metrics,
        date: new Date().toISOString()
      }
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, 5)
        localStorage.setItem('demandHistory', JSON.stringify(next))
        return next
      })
    } catch (err) {
      setError(err?.message || 'Nie udało się przeliczyć prognozy')
    } finally {
      setLoading(false)
    }
  }

  const persistLocal = (data) => {
    localStorage.setItem('localScenarios', JSON.stringify(data.filter((s) => s.id !== 'custom')))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    try {
      if (form.id) {
        await api.updateDemandScenario(form.id, {
          name: form.name,
          multiplier: form.multiplier,
          backlog_weeks: form.backlogWeeks
        })
      } else {
        const created = await api.createDemandScenario({
          name: form.name,
          multiplier: form.multiplier,
          backlog_weeks: form.backlogWeeks
        })
        setSelected(created)
      }
      const data = await api.getDemandScenarios()
      setScenarios([defaultScenario, ...data])
      persistLocal(data)
      setForm({ id: null, name: '', multiplier: 1, backlogWeeks: 4 })
    } catch (err) {
      setError(err?.message || 'Nie udało się zapisać scenariusza')
    }
  }

  const handleDelete = async () => {
    if (!form.id) return
    try {
      await api.deleteDemandScenario(form.id)
      const data = await api.getDemandScenarios()
      setScenarios([defaultScenario, ...data])
      persistLocal(data)
      setForm({ id: null, name: '', multiplier: 1, backlogWeeks: 4 })
      setSelected(defaultScenario)
    } catch (err) {
      setError(err?.message || 'Nie udało się usunąć')
    }
  }

  return (
    <section className={styles.planner}>
      <header>
        <div>
          <p>{l.addScenario}</p>
          <select value={selected.id} onChange={(e) => handleScenarioChange(e.target.value)}>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleRun} disabled={loading}>
          {loading ? '…' : l.run}
        </button>
      </header>

      <form className={styles.form} onSubmit={handleSave}>
        <label>
          {l.name}
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </label>
        <label>
          {l.multiplier}
          <input
            type="number"
            min="0.5"
            max="2"
            step="0.1"
            value={form.multiplier}
            onChange={(e) => setForm((prev) => ({ ...prev, multiplier: Number(e.target.value) }))}
          />
        </label>
        <label>
          {l.backlog}
          <input
            type="number"
            min="1"
            max="24"
            value={form.backlogWeeks}
            onChange={(e) => setForm((prev) => ({ ...prev, backlogWeeks: Number(e.target.value) }))}
          />
        </label>
        <div className={styles.formActions}>
          <button type="submit">{form.id ? l.update : l.save}</button>
          {form.id && (
            <button type="button" onClick={handleDelete} className={styles.deleteBtn}>
              {l.delete}
            </button>
          )}
        </div>
      </form>

      <div className={styles.controls}>
        <label>
          {l.multiplier}
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.1"
            value={selected.multiplier}
            onChange={(e) => setSelected({ ...selected, multiplier: Number(e.target.value) })}
          />
          <span>{selected.multiplier.toFixed(1)}×</span>
        </label>
        <label>
          {l.backlog}
          <input
            type="number"
            min="1"
            max="12"
            value={selected.backlogWeeks}
            onChange={(e) => setSelected({ ...selected, backlogWeeks: Number(e.target.value) })}
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!forecast && !error && <p className={styles.notice}>{l.notice}</p>}

      {forecast && (
        <div className={styles.results}>
          <div className={styles.metrics}>
            <div>
              <span>{l.revenue}</span>
              <strong>{(forecast.revenue ?? 0).toLocaleString()}</strong>
            </div>
            <div>
              <span>{l.capacity}</span>
              <strong>{forecast.capacityUsage ?? forecast.capacity_usage}%</strong>
            </div>
          </div>
          <div className={styles.cards}>
            {l.cards.map((label, index) => (
              <article key={label}>
                <h3>{label}</h3>
                <p>{forecast.metrics?.[index]}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className={styles.history}>
          <h3>{l.historyTitle}</h3>
          <div className={styles.historyGrid}>
            {history.map((run) => (
              <article key={run.id}>
                <header>
                  <strong>{run.scenarioName}</strong>
                  <span>{new Date(run.date).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US')}</span>
                </header>
                <p>{l.revenue}: {(run.revenue ?? 0).toLocaleString()}</p>
                <p>{l.capacity}: {run.capacity ?? 0}%</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
