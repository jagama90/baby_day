'use client'

import { Capacitor, registerPlugin } from '@capacitor/core'

type NativePreferences = {
  get: (options: { key: string }) => Promise<{ value: string | null }>
  set: (options: { key: string; value: string }) => Promise<void>
  remove: (options: { key: string }) => Promise<void>
}

const Preferences = registerPlugin<NativePreferences>('Preferences')

const STORAGE_KEY_REGISTRY = '__babyday_storage_keys__'

const getNativePreferences = () => {
  if (typeof window === 'undefined') return null
  return Capacitor.isNativePlatform() ? Preferences : null
}

const readRegistryFromRaw = (raw: string | null): string[] => {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const getTrackedStorageKeys = async (): Promise<string[]> => {
  const preferences = getNativePreferences()
  if (preferences) {
    const { value } = await preferences.get({ key: STORAGE_KEY_REGISTRY })
    return readRegistryFromRaw(value)
  }

  if (typeof window === 'undefined') return []
  return readRegistryFromRaw(window.localStorage.getItem(STORAGE_KEY_REGISTRY))
}

const setTrackedStorageKeys = async (keys: string[]): Promise<void> => {
  const normalized = [...new Set(keys)]
  const value = JSON.stringify(normalized)
  const preferences = getNativePreferences()

  if (preferences) {
    await preferences.set({ key: STORAGE_KEY_REGISTRY, value })
    return
  }

  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY_REGISTRY, value)
}

const addStorageKeyToRegistry = async (key: string): Promise<void> => {
  const keys = await getTrackedStorageKeys()
  if (keys.includes(key)) return
  keys.push(key)
  await setTrackedStorageKeys(keys)
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
    await addStorageKeyToRegistry(key)
    return
  }

  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
  await addStorageKeyToRegistry(key)
}

export const clearStoredValues = async (): Promise<void> => {
  const keys = await getTrackedStorageKeys()
  const preferences = getNativePreferences()
  if (preferences) {
    await Promise.all(keys.map((key) => preferences.remove({ key })))
    await preferences.remove({ key: STORAGE_KEY_REGISTRY })
    return
  }

  if (typeof window === 'undefined') return
  keys.forEach((key) => window.localStorage.removeItem(key))
  window.localStorage.removeItem(STORAGE_KEY_REGISTRY)
}
