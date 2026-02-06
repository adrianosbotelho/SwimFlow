type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const cacheStore = new Map<string, CacheEntry<unknown>>()

export const cacheGet = <T>(key: string): T | undefined => {
  const entry = cacheStore.get(key)
  if (!entry) return undefined
  if (Date.now() >= entry.expiresAt) {
    cacheStore.delete(key)
    return undefined
  }
  return entry.value as T
}

export const cacheSet = <T>(key: string, value: T, ttlMs: number): void => {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}

export const cacheDelete = (key: string): void => {
  cacheStore.delete(key)
}
