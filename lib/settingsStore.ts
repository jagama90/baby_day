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

export const loadSettingsFromStorage = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  return {
    babyName: localStorage.getItem('babyName') || DEFAULT_SETTINGS.babyName,
    babyBirth: localStorage.getItem('babyBirth') || DEFAULT_SETTINGS.babyBirth,
    formulaGoal: localStorage.getItem('formulaGoal') || DEFAULT_SETTINGS.formulaGoal,
    feedWarnHour: localStorage.getItem('feedWarnHour') || DEFAULT_SETTINGS.feedWarnHour,
    darkMode: localStorage.getItem('darkMode') || DEFAULT_SETTINGS.darkMode,
    pushEnabled: localStorage.getItem('pushEnabled') || DEFAULT_SETTINGS.pushEnabled,
    babyWeight: localStorage.getItem('babyWeight') || DEFAULT_SETTINGS.babyWeight,
    avgFormulaMl: localStorage.getItem('avgFormulaMl') || DEFAULT_SETTINGS.avgFormulaMl,
  }
}

export const saveSettingToStorage = (key: keyof AppSettings, value: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, value)
}
