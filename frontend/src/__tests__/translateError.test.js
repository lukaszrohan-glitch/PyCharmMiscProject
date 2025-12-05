import { describe, expect, it } from 'vitest'
import { translateError } from '../services/api'

describe('translateError', () => {
  describe('Polish translations (pl)', () => {
    it('translates invalid_credentials code', () => {
      const err = { code: 'invalid_credentials', message: 'Auth failed' }
      expect(translateError(err, 'pl')).toBe('Błędny email lub hasło')
    })

    it('translates auth_internal_error code', () => {
      const err = { code: 'auth_internal_error', message: 'Server error' }
      expect(translateError(err, 'pl')).toBe('Logowanie chwilowo niedostępne')
    })

    it('translates admin_create_user_failed code', () => {
      const err = { code: 'admin_create_user_failed', message: 'Failed' }
      expect(translateError(err, 'pl')).toBe('Nie udało się utworzyć użytkownika')
    })

    it('translates plan_create_failed code', () => {
      const err = { code: 'plan_create_failed', message: 'Plan error' }
      expect(translateError(err, 'pl')).toBe('Nie udało się stworzyć planu')
    })

    it('translates api_key_create_failed code', () => {
      const err = { code: 'api_key_create_failed', message: 'Key error' }
      expect(translateError(err, 'pl')).toBe('Nie udało się utworzyć klucza API')
    })

    it('translates api_key_not_found code', () => {
      const err = { code: 'api_key_not_found', message: 'Not found' }
      expect(translateError(err, 'pl')).toBe('Klucz API nie istnieje')
    })

    it('translates api_key_rotate_failed code', () => {
      const err = { code: 'api_key_rotate_failed', message: 'Rotate error' }
      expect(translateError(err, 'pl')).toBe('Nie udało się odświeżyć klucza API')
    })

    it('translates api_keys_list_failed code', () => {
      const err = { code: 'api_keys_list_failed', message: 'List error' }
      expect(translateError(err, 'pl')).toBe('Nie udało się pobrać kluczy API')
    })

    it('translates import_failed code', () => {
      const err = { code: 'import_failed', message: 'Import error' }
      expect(translateError(err, 'pl')).toBe('Import danych nie powiódł się')
    })

    it('translates demand_scenario_create_failed code', () => {
      const err = { code: 'demand_scenario_create_failed', message: 'Create error' }
      expect(translateError(err, 'pl')).toBe('Nie można zapisać scenariusza popytu')
    })

    it('translates demand_scenario_update_failed code', () => {
      const err = { code: 'demand_scenario_update_failed', message: 'Update error' }
      expect(translateError(err, 'pl')).toBe('Aktualizacja scenariusza popytu nie powiodła się')
    })

    it('translates demand_scenario_delete_failed code', () => {
      const err = { code: 'demand_scenario_delete_failed', message: 'Delete error' }
      expect(translateError(err, 'pl')).toBe('Nie udało się usunąć scenariusza')
    })

    it('translates demand_scenario_not_found code', () => {
      const err = { code: 'demand_scenario_not_found', message: 'Not found' }
      expect(translateError(err, 'pl')).toBe('Wybrany scenariusz nie istnieje')
    })

    it('translates demand_forecast_failed code', () => {
      const err = { code: 'demand_forecast_failed', message: 'Forecast error' }
      expect(translateError(err, 'pl')).toBe('Prognoza popytu niedostępna')
    })

    it('translates demand_scenario_init_failed code', () => {
      const err = { code: 'demand_scenario_init_failed', message: 'Init error' }
      expect(translateError(err, 'pl')).toBe('Baza scenariuszy nie jest gotowa')
    })
  })

  describe('English translations (en)', () => {
    it('translates invalid_credentials code', () => {
      const err = { code: 'invalid_credentials', message: 'Auth failed' }
      expect(translateError(err, 'en')).toBe('Invalid email or password')
    })

    it('translates auth_internal_error code', () => {
      const err = { code: 'auth_internal_error', message: 'Server error' }
      expect(translateError(err, 'en')).toBe('Login temporarily unavailable')
    })

    it('translates admin_create_user_failed code', () => {
      const err = { code: 'admin_create_user_failed', message: 'Failed' }
      expect(translateError(err, 'en')).toBe('Failed to create user')
    })

    it('translates demand_scenario_create_failed code', () => {
      const err = { code: 'demand_scenario_create_failed', message: 'Create error' }
      expect(translateError(err, 'en')).toBe('Unable to save demand scenario')
    })

    it('translates demand_scenario_update_failed code', () => {
      const err = { code: 'demand_scenario_update_failed', message: 'Update error' }
      expect(translateError(err, 'en')).toBe('Demand scenario update failed')
    })

    it('translates demand_scenario_delete_failed code', () => {
      const err = { code: 'demand_scenario_delete_failed', message: 'Delete error' }
      expect(translateError(err, 'en')).toBe('Failed to delete scenario')
    })

    it('translates demand_scenario_not_found code', () => {
      const err = { code: 'demand_scenario_not_found', message: 'Not found' }
      expect(translateError(err, 'en')).toBe('Scenario not found')
    })

    it('translates demand_forecast_failed code', () => {
      const err = { code: 'demand_forecast_failed', message: 'Forecast error' }
      expect(translateError(err, 'en')).toBe('Demand forecast failed')
    })

    it('translates import_failed code', () => {
      const err = { code: 'import_failed', message: 'Import error' }
      expect(translateError(err, 'en')).toBe('Import failed')
    })
  })

  describe('Edge cases', () => {
    it('falls back to message when code is unknown', () => {
      const err = { code: 'unknown_error_code', message: 'Original message' }
      expect(translateError(err, 'pl')).toBe('Original message')
    })

    it('handles null error gracefully', () => {
      expect(translateError(null, 'pl')).toBe('')
    })

    it('handles undefined error gracefully', () => {
      expect(translateError(undefined, 'pl')).toBe('')
    })

    it('handles error with nested detail.code', () => {
      const err = { detail: { code: 'invalid_credentials' }, message: 'Error' }
      expect(translateError(err, 'pl')).toBe('Błędny email lub hasło')
    })

    it('defaults to Polish when lang is not specified', () => {
      const err = { code: 'invalid_credentials', message: 'Auth failed' }
      expect(translateError(err)).toBe('Błędny email lub hasło')
    })

    it('falls back to Polish for unsupported languages', () => {
      const err = { code: 'invalid_credentials', message: 'Auth failed' }
      expect(translateError(err, 'de')).toBe('Błędny email lub hasło')
    })

    it('handles Error instance', () => {
      const err = new Error('Network failure')
      err.code = 'invalid_credentials'
      expect(translateError(err, 'pl')).toBe('Błędny email lub hasło')
    })

    it('handles error with only message', () => {
      const err = { message: 'Simple error message' }
      expect(translateError(err, 'pl')).toBe('Simple error message')
    })
  })
})

// Snapshot test for all translation mappings
describe('translateError snapshots', () => {
  const allCodes = [
    'invalid_credentials',
    'auth_internal_error',
    'admin_create_user_failed',
    'plan_create_failed',
    'api_key_create_failed',
    'api_key_not_found',
    'api_key_rotate_failed',
    'api_keys_list_failed',
    'import_failed',
    'demand_scenario_create_failed',
    'demand_scenario_update_failed',
    'demand_scenario_delete_failed',
    'demand_scenario_not_found',
    'demand_forecast_failed',
    'demand_scenario_init_failed'
  ]

  it('matches Polish translations snapshot', () => {
    const translations = {}
    allCodes.forEach(code => {
      translations[code] = translateError({ code }, 'pl')
    })
    expect(translations).toMatchSnapshot()
  })

  it('matches English translations snapshot', () => {
    const translations = {}
    allCodes.forEach(code => {
      translations[code] = translateError({ code }, 'en')
    })
    expect(translations).toMatchSnapshot()
  })
})

