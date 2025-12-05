/**
 * Advanced Filters Component
 * Provides filtering with operators (equals, contains, greater than, etc.)
 * Supports saving filter presets
 */
import { useState, useCallback, useMemo } from 'react';
import styles from './AdvancedFilters.module.css';

const OPERATORS = {
  text: [
    { id: 'contains', label: { pl: 'zawiera', en: 'contains' } },
    { id: 'equals', label: { pl: 'równa się', en: 'equals' } },
    { id: 'startsWith', label: { pl: 'zaczyna się od', en: 'starts with' } },
    { id: 'endsWith', label: { pl: 'kończy się na', en: 'ends with' } },
    { id: 'notContains', label: { pl: 'nie zawiera', en: 'does not contain' } },
  ],
  number: [
    { id: 'equals', label: { pl: '=', en: '=' } },
    { id: 'notEquals', label: { pl: '≠', en: '≠' } },
    { id: 'greaterThan', label: { pl: '>', en: '>' } },
    { id: 'lessThan', label: { pl: '<', en: '<' } },
    { id: 'greaterOrEqual', label: { pl: '≥', en: '≥' } },
    { id: 'lessOrEqual', label: { pl: '≤', en: '≤' } },
    { id: 'between', label: { pl: 'między', en: 'between' } },
  ],
  date: [
    { id: 'equals', label: { pl: 'w dniu', en: 'on' } },
    { id: 'before', label: { pl: 'przed', en: 'before' } },
    { id: 'after', label: { pl: 'po', en: 'after' } },
    { id: 'between', label: { pl: 'między', en: 'between' } },
    { id: 'lastNDays', label: { pl: 'ostatnie N dni', en: 'last N days' } },
  ],
  select: [
    { id: 'equals', label: { pl: 'jest', en: 'is' } },
    { id: 'notEquals', label: { pl: 'nie jest', en: 'is not' } },
    { id: 'in', label: { pl: 'jest jednym z', en: 'is one of' } },
  ],
};

function FilterRow({ filter, fields, lang, onChange, onRemove }) {
  const selectedField = fields.find(f => f.id === filter.field);
  const operators = selectedField ? OPERATORS[selectedField.type] || OPERATORS.text : OPERATORS.text;

  return (
    <div className={styles.filterRow}>
      <select
        value={filter.field}
        onChange={(e) => onChange({ ...filter, field: e.target.value, value: '', value2: '' })}
        className={styles.fieldSelect}
        aria-label={lang === 'pl' ? 'Pole' : 'Field'}
      >
        <option value="">{lang === 'pl' ? 'Wybierz pole...' : 'Select field...'}</option>
        {fields.map(field => (
          <option key={field.id} value={field.id}>
            {field.label[lang] || field.label.en}
          </option>
        ))}
      </select>

      <select
        value={filter.operator}
        onChange={(e) => onChange({ ...filter, operator: e.target.value })}
        className={styles.operatorSelect}
        disabled={!filter.field}
        aria-label={lang === 'pl' ? 'Operator' : 'Operator'}
      >
        {operators.map(op => (
          <option key={op.id} value={op.id}>
            {op.label[lang] || op.label.en}
          </option>
        ))}
      </select>

      {selectedField?.type === 'select' ? (
        <select
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          className={styles.valueInput}
          aria-label={lang === 'pl' ? 'Wartość' : 'Value'}
        >
          <option value="">{lang === 'pl' ? 'Wybierz...' : 'Select...'}</option>
          {selectedField.options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label[lang] || opt.label.en || opt.value}
            </option>
          ))}
        </select>
      ) : selectedField?.type === 'date' ? (
        <>
          <input
            type="date"
            value={filter.value}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
            className={styles.valueInput}
            aria-label={lang === 'pl' ? 'Data' : 'Date'}
          />
          {filter.operator === 'between' && (
            <input
              type="date"
              value={filter.value2 || ''}
              onChange={(e) => onChange({ ...filter, value2: e.target.value })}
              className={styles.valueInput}
              aria-label={lang === 'pl' ? 'Data końcowa' : 'End date'}
            />
          )}
        </>
      ) : selectedField?.type === 'number' ? (
        <>
          <input
            type="number"
            value={filter.value}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
            className={styles.valueInput}
            placeholder={lang === 'pl' ? 'Wartość' : 'Value'}
            aria-label={lang === 'pl' ? 'Wartość' : 'Value'}
          />
          {filter.operator === 'between' && (
            <input
              type="number"
              value={filter.value2 || ''}
              onChange={(e) => onChange({ ...filter, value2: e.target.value })}
              className={styles.valueInput}
              placeholder={lang === 'pl' ? 'Do' : 'To'}
              aria-label={lang === 'pl' ? 'Wartość końcowa' : 'End value'}
            />
          )}
        </>
      ) : (
        <input
          type="text"
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          className={styles.valueInput}
          placeholder={lang === 'pl' ? 'Wpisz wartość...' : 'Enter value...'}
          aria-label={lang === 'pl' ? 'Wartość' : 'Value'}
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        className={styles.removeBtn}
        aria-label={lang === 'pl' ? 'Usuń filtr' : 'Remove filter'}
      >
        ✕
      </button>
    </div>
  );
}

export default function AdvancedFilters({
  fields,
  filters,
  onFiltersChange,
  lang = 'pl',
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}) {
  const [isExpanded, setIsExpanded] = useState(filters.length > 0);
  const [presetName, setPresetName] = useState('');

  const t = {
    advancedFilters: lang === 'pl' ? 'Zaawansowane filtry' : 'Advanced filters',
    addFilter: lang === 'pl' ? 'Dodaj filtr' : 'Add filter',
    clearAll: lang === 'pl' ? 'Wyczyść wszystko' : 'Clear all',
    apply: lang === 'pl' ? 'Zastosuj' : 'Apply',
    savePreset: lang === 'pl' ? 'Zapisz widok' : 'Save preset',
    presetName: lang === 'pl' ? 'Nazwa widoku' : 'Preset name',
    savedPresets: lang === 'pl' ? 'Zapisane widoki' : 'Saved presets',
    noFilters: lang === 'pl' ? 'Brak aktywnych filtrów' : 'No active filters',
  };

  const addFilter = useCallback(() => {
    onFiltersChange([
      ...filters,
      { id: Date.now(), field: '', operator: 'contains', value: '' }
    ]);
  }, [filters, onFiltersChange]);

  const updateFilter = useCallback((index, updatedFilter) => {
    const newFilters = [...filters];
    newFilters[index] = updatedFilter;
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const removeFilter = useCallback((index) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange([]);
  }, [onFiltersChange]);

  const handleSavePreset = useCallback(() => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({ name: presetName.trim(), filters });
      setPresetName('');
    }
  }, [presetName, filters, onSavePreset]);

  const activeFilterCount = useMemo(() =>
    filters.filter(f => f.field && f.value).length,
    [filters]
  );

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.toggleBtn}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</span>
        <span>{t.advancedFilters}</span>
        {activeFilterCount > 0 && (
          <span className={styles.badge}>{activeFilterCount}</span>
        )}
      </button>

      {isExpanded && (
        <div className={styles.panel}>
          {filters.length === 0 ? (
            <p className={styles.noFilters}>{t.noFilters}</p>
          ) : (
            <div className={styles.filtersList}>
              {filters.map((filter, index) => (
                <FilterRow
                  key={filter.id}
                  filter={filter}
                  fields={fields}
                  lang={lang}
                  onChange={(updated) => updateFilter(index, updated)}
                  onRemove={() => removeFilter(index)}
                />
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={addFilter}
            >
              ➕ {t.addFilter}
            </button>

            {filters.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearAllFilters}
              >
                {t.clearAll}
              </button>
            )}
          </div>

          {/* Presets section */}
          {(onSavePreset || presets.length > 0) && (
            <div className={styles.presetsSection}>
              {onSavePreset && filters.length > 0 && (
                <div className={styles.savePreset}>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder={t.presetName}
                    className={styles.presetInput}
                  />
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                  >
                    {t.savePreset}
                  </button>
                </div>
              )}

              {presets.length > 0 && (
                <div className={styles.presetsList}>
                  <span className={styles.presetsLabel}>{t.savedPresets}:</span>
                  {presets.map((preset, i) => (
                    <div key={i} className={styles.presetItem}>
                      <button
                        type="button"
                        className={styles.presetBtn}
                        onClick={() => onLoadPreset?.(preset)}
                      >
                        {preset.name}
                      </button>
                      {onDeletePreset && (
                        <button
                          type="button"
                          className={styles.presetDeleteBtn}
                          onClick={() => onDeletePreset(preset)}
                          aria-label={lang === 'pl' ? 'Usuń widok' : 'Delete preset'}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


