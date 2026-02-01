import { vi } from 'vitest';
import chartCacheService from '../chartCacheService';

describe('ChartCacheService', () => {
  beforeEach(() => {
    // Clear cache before each test
    chartCacheService.invalidateAll();
  });

  describe('basic cache operations', () => {
    it('should store and retrieve data', () => {
      const testData = { test: 'data' };
      const cacheKey = { studentId: 'student-1', metric: 'overall' };

      chartCacheService.set(cacheKey, testData);
      const retrieved = chartCacheService.get(cacheKey);

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const cacheKey = { studentId: 'non-existent', metric: 'overall' };
      const retrieved = chartCacheService.get(cacheKey);

      expect(retrieved).toBeNull();
    });

    it('should handle TTL expiration', (done) => {
      const testData = { test: 'data' };
      const cacheKey = { studentId: 'student-1', metric: 'overall' };
      const shortTTL = 50; // 50ms

      chartCacheService.set(cacheKey, testData, shortTTL);

      // Should be available immediately
      expect(chartCacheService.get(cacheKey)).toEqual(testData);

      // Should be expired after TTL
      setTimeout(() => {
        expect(chartCacheService.get(cacheKey)).toBeNull();
        done();
      }, shortTTL + 10);
    });
  });

  describe('cache invalidation', () => {
    beforeEach(() => {
      // Set up test data
      chartCacheService.set({ studentId: 'student-1', strokeType: 'crawl', metric: 'technique' }, 'data1');
      chartCacheService.set({ studentId: 'student-1', strokeType: 'costas', metric: 'technique' }, 'data2');
      chartCacheService.set({ studentId: 'student-2', strokeType: 'crawl', metric: 'technique' }, 'data3');
    });

    it('should invalidate all entries for a student', () => {
      chartCacheService.invalidateStudent('student-1');

      expect(chartCacheService.get({ studentId: 'student-1', strokeType: 'crawl', metric: 'technique' })).toBeNull();
      expect(chartCacheService.get({ studentId: 'student-1', strokeType: 'costas', metric: 'technique' })).toBeNull();
      expect(chartCacheService.get({ studentId: 'student-2', strokeType: 'crawl', metric: 'technique' })).not.toBeNull();
    });

    it('should invalidate specific stroke type', () => {
      chartCacheService.invalidate({ studentId: 'student-1', strokeType: 'crawl' });

      expect(chartCacheService.get({ studentId: 'student-1', strokeType: 'crawl', metric: 'technique' })).toBeNull();
      expect(chartCacheService.get({ studentId: 'student-1', strokeType: 'costas', metric: 'technique' })).not.toBeNull();
      expect(chartCacheService.get({ studentId: 'student-2', strokeType: 'crawl', metric: 'technique' })).not.toBeNull();
    });

    it('should invalidate all cache', () => {
      chartCacheService.invalidateAll();

      expect(chartCacheService.get({ studentId: 'student-1', strokeType: 'crawl', metric: 'technique' })).toBeNull();
      expect(chartCacheService.get({ studentId: 'student-1', strokeType: 'costas', metric: 'technique' })).toBeNull();
      expect(chartCacheService.get({ studentId: 'student-2', strokeType: 'crawl', metric: 'technique' })).toBeNull();
    });
  });

  describe('event listeners', () => {
    it('should notify listeners on cache invalidation', (done) => {
      const testData = { test: 'data' };
      const cacheKey = { studentId: 'student-1', metric: 'overall' };

      chartCacheService.set(cacheKey, testData);

      const unsubscribe = chartCacheService.addInvalidationListener((key) => {
        expect(key).toContain('student-1');
        unsubscribe();
        done();
      });

      chartCacheService.invalidateStudent('student-1');
    });

    it('should allow unsubscribing from listeners', () => {
      const listener = vi.fn();
      const unsubscribe = chartCacheService.addInvalidationListener(listener);

      unsubscribe();
      chartCacheService.invalidateAll();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cache statistics', () => {
    it('should provide cache statistics', () => {
      chartCacheService.set({ studentId: 'student-1', metric: 'overall' }, 'data1');
      chartCacheService.set({ studentId: 'student-2', metric: 'technique' }, 'data2');

      const stats = chartCacheService.getStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty('key');
      expect(stats.entries[0]).toHaveProperty('timestamp');
      expect(stats.entries[0]).toHaveProperty('expiresAt');
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', (done) => {
      const testData = { test: 'data' };
      const cacheKey = { studentId: 'student-1', metric: 'overall' };
      const shortTTL = 50; // 50ms

      chartCacheService.set(cacheKey, testData, shortTTL);

      setTimeout(() => {
        chartCacheService.cleanup();
        const stats = chartCacheService.getStats();
        expect(stats.size).toBe(0);
        done();
      }, shortTTL + 10);
    });
  });
});