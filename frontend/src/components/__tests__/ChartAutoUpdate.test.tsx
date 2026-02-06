import { describe, it, expect, vi, beforeEach } from 'vitest';
import chartCacheService from '../../services/chartCacheService';
import evolutionService from '../../services/evolutionService';

describe('Chart Auto Update Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chartCacheService.invalidateAll();
  });

  it('should invalidate cache when student data changes', () => {
    // Set up test data in cache
    const studentId = 'student-123';
    const testData = { test: 'evolution data' };
    
    chartCacheService.set({ studentId, metric: 'overall' }, testData);
    
    // Verify data is cached
    expect(chartCacheService.get({ studentId, metric: 'overall' })).toEqual(testData);
    
    // Invalidate cache for student
    evolutionService.invalidateStudentCache(studentId);
    
    // Verify cache is cleared
    expect(chartCacheService.get({ studentId, metric: 'overall' })).toBeNull();
  });

  it('should handle cache invalidation listeners', async () => {
    const studentId = 'student-123';
    let listenerCalled = false;
    chartCacheService.set({ studentId, metric: 'overall' }, { test: 'data' });
    
    const listenerPromise = new Promise<void>((resolve) => {
      const unsubscribe = chartCacheService.addInvalidationListener((key) => {
        if (key.includes(studentId)) {
          listenerCalled = true;
          unsubscribe();
          expect(listenerCalled).toBe(true);
          resolve();
        }
      });
    });
    
    // Trigger invalidation
    chartCacheService.invalidateStudent(studentId);
    await listenerPromise;
  });

  it('should maintain separate cache entries for different students', () => {
    const student1 = 'student-1';
    const student2 = 'student-2';
    const data1 = { student: 1 };
    const data2 = { student: 2 };
    
    // Set data for both students
    chartCacheService.set({ studentId: student1, metric: 'overall' }, data1);
    chartCacheService.set({ studentId: student2, metric: 'overall' }, data2);
    
    // Verify both are cached
    expect(chartCacheService.get({ studentId: student1, metric: 'overall' })).toEqual(data1);
    expect(chartCacheService.get({ studentId: student2, metric: 'overall' })).toEqual(data2);
    
    // Invalidate only student1
    chartCacheService.invalidateStudent(student1);
    
    // Verify only student1 cache is cleared
    expect(chartCacheService.get({ studentId: student1, metric: 'overall' })).toBeNull();
    expect(chartCacheService.get({ studentId: student2, metric: 'overall' })).toEqual(data2);
  });

  it('should handle different metrics for same student', () => {
    const studentId = 'student-123';
    const overallData = { metric: 'overall' };
    const techniqueData = { metric: 'technique' };
    
    // Set data for different metrics
    chartCacheService.set({ studentId, metric: 'overall' }, overallData);
    chartCacheService.set({ studentId, metric: 'technique' }, techniqueData);
    
    // Verify both are cached
    expect(chartCacheService.get({ studentId, metric: 'overall' })).toEqual(overallData);
    expect(chartCacheService.get({ studentId, metric: 'technique' })).toEqual(techniqueData);
    
    // Invalidate specific metric
    chartCacheService.invalidate({ studentId, metric: 'overall' });
    
    // Verify only overall metric is cleared
    expect(chartCacheService.get({ studentId, metric: 'overall' })).toBeNull();
    expect(chartCacheService.get({ studentId, metric: 'technique' })).toEqual(techniqueData);
  });

  it('should track loading and error states', () => {
    const studentId = 'student-123';
    const loadingKey = `evolution-${studentId}-all`;
    
    // Initially should not be loading
    expect(evolutionService.isLoading(loadingKey)).toBe(false);
    expect(evolutionService.getError(loadingKey)).toBeNull();
  });
});
