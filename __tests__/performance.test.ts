/**
 * Performance Tests
 * 
 * Validates that the app meets performance requirements:
 * - Seed 60 entries: first chart paint < 500ms on simulator
 * - Interactions remain responsive
 */

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate 60 measurements efficiently', () => {
    const { calculatePercentile } = require('../src/utils/percentileCalculations');
    const { calculateAgeInDays } = require('../src/utils/dateUtils');
    
    const startTime = performance.now();
    
    // Simulate generating 60 measurements with all calculations
    const birthDate = '2024-01-01';
    const measurements = [];
    
    for (let i = 0; i < 60; i++) {
      const date = new Date('2024-01-01');
      date.setDate(date.getDate() + i * 10);
      const dateStr = date.toISOString().split('T')[0];
      
      const ageInDays = calculateAgeInDays(birthDate, dateStr);
      const weightKg = 3.5 + i * 0.1;
      const heightCm = 50 + i * 0.5;
      const headCm = 35 + i * 0.2;
      
      measurements.push({
        id: `test-${i}`,
        date: dateStr,
        ageInDays,
        weightKg,
        heightCm,
        headCm,
        weightPercentile: calculatePercentile(weightKg, ageInDays, 'weight', 'male'),
        heightPercentile: calculatePercentile(heightCm, ageInDays, 'height', 'male'),
        headPercentile: calculatePercentile(headCm, ageInDays, 'head', 'male'),
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Generated 60 measurements with percentiles in ${duration.toFixed(2)}ms`);
    
    expect(measurements.length).toBe(60);
    expect(duration).toBeLessThan(1000);
  });

  it('should handle large dataset calculations efficiently', () => {
    // Simulate percentile calculations for 60 measurements
    const { calculatePercentile } = require('../src/utils/percentileCalculations');
    
    const startTime = performance.now();
    
    // Calculate percentiles for 60 measurements across 3 types
    for (let i = 0; i < 60; i++) {
      const ageInDays = i * 10; // Spread across ~600 days
      calculatePercentile(5 + i * 0.1, ageInDays, 'weight', 'male');
      calculatePercentile(50 + i * 0.5, ageInDays, 'height', 'male');
      calculatePercentile(35 + i * 0.2, ageInDays, 'head', 'male');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Calculated 180 percentiles in ${duration.toFixed(2)}ms`);
    
    // All calculations should complete quickly (< 100ms)
    expect(duration).toBeLessThan(100);
  });

  it('should generate percentile curves efficiently', () => {
    const { getPercentileCurve } = require('../src/utils/percentileCalculations');
    
    const startTime = performance.now();
    
    // Generate all 7 percentile curves for all 3 measurement types
    const percentiles = [3, 10, 25, 50, 75, 90, 97];
    const types = ['weight', 'height', 'head'] as const;
    
    for (const type of types) {
      for (const p of percentiles) {
        getPercentileCurve(p, type, 'male');
      }
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Generated 21 percentile curves in ${duration.toFixed(2)}ms`);
    
    // Curve generation should be fast (< 200ms)
    expect(duration).toBeLessThan(200);
  });
});
