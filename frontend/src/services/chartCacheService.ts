export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface ChartCacheKey {
  studentId: string;
  strokeType?: string;
  timeRange?: string;
  metric?: string;
}

class ChartCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly listeners = new Set<(key: string) => void>();

  private generateKey(cacheKey: ChartCacheKey): string {
    const { studentId, strokeType, timeRange, metric } = cacheKey;
    return `${studentId}:${strokeType || 'all'}:${timeRange || 'all'}:${metric || 'overall'}`;
  }

  get<T>(cacheKey: ChartCacheKey): T | null {
    const key = this.generateKey(cacheKey);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(cacheKey: ChartCacheKey, data: T, ttl: number = this.DEFAULT_TTL): void {
    const key = this.generateKey(cacheKey);
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  invalidate(cacheKey: Partial<ChartCacheKey>): void {
    const keysToDelete: string[] = [];
    
    // Find all keys that match the partial key
    for (const [key] of this.cache) {
      const keyParts = key.split(':');
      const [studentId, strokeType, timeRange, metric] = keyParts;
      
      let shouldInvalidate = true;
      
      if (cacheKey.studentId && studentId !== cacheKey.studentId) {
        shouldInvalidate = false;
      }
      if (cacheKey.strokeType && strokeType !== cacheKey.strokeType) {
        shouldInvalidate = false;
      }
      if (cacheKey.timeRange && timeRange !== cacheKey.timeRange) {
        shouldInvalidate = false;
      }
      if (cacheKey.metric && metric !== cacheKey.metric) {
        shouldInvalidate = false;
      }
      
      if (shouldInvalidate) {
        keysToDelete.push(key);
      }
    }
    
    // Delete matching keys
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.notifyListeners(key);
    });
  }

  invalidateStudent(studentId: string): void {
    this.invalidate({ studentId });
  }

  invalidateAll(): void {
    const keys = Array.from(this.cache.keys());
    this.cache.clear();
    keys.forEach(key => this.notifyListeners(key));
  }

  // Event listeners for cache invalidation
  addInvalidationListener(callback: (key: string) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(key: string): void {
    this.listeners.forEach(callback => {
      try {
        callback(key);
      } catch (error) {
        console.error('Error in cache invalidation listener:', error);
      }
    });
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });
  }

  // Get cache statistics
  getStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; timestamp: number; expiresAt: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt
    }));

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for this
      entries
    };
  }
}

// Create singleton instance
const chartCacheService = new ChartCacheService();

// Setup periodic cleanup
setInterval(() => {
  chartCacheService.cleanup();
}, 60 * 1000); // Cleanup every minute

export default chartCacheService;