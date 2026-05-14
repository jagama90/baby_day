'use client'

import { Capacitor } from '@capacitor/core'

type NativePreferences = {
  get: (options: { key: string }) => Promise<{ value: string | null }>
  set: (options: { key: string; value: string }) => Promise<void>
  clear: () => Promise<void>
}

const getNativePreferences = (): NativePreferences | null => {
  if (typeof window === 'undefined') return null
  if (!Capacitor.isNativePlatform()) return null

  const maybePreferences = (window as typeof window & {
    Capacitor?: { Plugins?: { Preferences?: NativePreferences } }
  }).Capacitor?.Plugins?.Preferences

  return maybePreferences ?? null
}

export const getStoredValue = async (key: string): Promise<string | null> => {
  const preferences = getNativePreferences()
  if (preferences) {
    const { value } = await preferences.get({ key })
    return value
  }

  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

export const setStoredValue = async (key: string, value: string): Promise<void> => {
  const preferences = getNativePreferences()
  if (preferences) {
    await preferences.set({ key, value })
    return
  }

  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

export const clearStoredValues = async (): Promise<void> => {
  const preferences = getNativePreferences()
  if (preferences) {
    await preferences.clear()
    return
  }

  if (typeof window === 'undefined') return
  window.localStorage.clear()
}
