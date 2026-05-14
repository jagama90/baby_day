'use client'

import { Capacitor } from '@capacitor/core'

type NativePreferences = {
  get: (options: { key: string }) => Promise<{ value: string | null }>
  set: (options: { key: string; value: string }) => Promise<void>
  remove: (options: { key: string }) => Promise<void>
}

const STORAGE_KEY_REGISTRY = '__babyday_storage_keys__'

const getNativePreferences = (): NativePreferences | null => {
  if (typeof window === 'undefined') return null
  if (!Capacitor.isNativePlatform()) return null

  const maybePreferences = (window as typeof window & {
    Capacitor?: { Plugins?: { Preferences?: NativePreferences } }
  }).Capacitor?.Plugins?.Preferences

  return maybePreferences ?? null
}

const addWebStorageKey = (key: string) => {
  const raw = window.localStorage.getItem(STORAGE_KEY_REGISTRY)
  const keys = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>()
  keys.add(key)
  window.localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify([...keys]))
}

const getTrackedWebStorageKeys = (): string[] => {
  const raw = window.localStorage.getItem(STORAGE_KEY_REGISTRY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
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
  addWebStorageKey(key)
}

export const clearStoredValues = async (): Promise<void> => {
  const preferences = getNativePreferences()
  if (preferences) {
    if (typeof window === 'undefined') return
    const keys = getTrackedWebStorageKeys()
    await Promise.all(keys.map((key) => preferences.remove({ key })))
    return
  }

  if (typeof window === 'undefined') return
  
  const keys = getTrackedWebStorageKeys()
  keys.forEach((key) => window.localStorage.removeItem(key))
  window.localStorage.removeItem(STORAGE_KEY_REGISTRY)
}
