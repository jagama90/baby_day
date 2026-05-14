export type AppSettings = {
  babyName: string
  babyBirth: string
  formulaGoal: string
  feedWarnHour: string
  darkMode: string
  pushEnabled: string
  babyWeight: string
  avgFormulaMl: string
}

const DEFAULT_SETTINGS: AppSettings = {
  babyName: '',
  babyBirth: '',
  formulaGoal: '',
  feedWarnHour: '3',
  darkMode: '0',
  pushEnabled: '0',
  babyWeight: '',
  avgFormulaMl: '',
}

import { getStoredValue, setStoredValue } from './platformStorage'

export const loadSettingsFromStorage = async (): Promise<AppSettings> => ({
  babyName: (await getStoredValue('babyName')) || DEFAULT_SETTINGS.babyName,
  babyBirth: (await getStoredValue('babyBirth')) || DEFAULT_SETTINGS.babyBirth,
  formulaGoal: (await getStoredValue('formulaGoal')) || DEFAULT_SETTINGS.formulaGoal,
  feedWarnHour: (await getStoredValue('feedWarnHour')) || DEFAULT_SETTINGS.feedWarnHour,
  darkMode: (await getStoredValue('darkMode')) || DEFAULT_SETTINGS.darkMode,
  pushEnabled: (await getStoredValue('pushEnabled')) || DEFAULT_SETTINGS.pushEnabled,
  babyWeight: (await getStoredValue('babyWeight')) || DEFAULT_SETTINGS.babyWeight,
  avgFormulaMl: (await getStoredValue('avgFormulaMl')) || DEFAULT_SETTINGS.avgFormulaMl,
})

export const saveSettingToStorage = async (key: keyof AppSettings, value: string) => {
  await setStoredValue(key, value)
}
