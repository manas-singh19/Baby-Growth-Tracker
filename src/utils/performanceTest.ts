import { generateSampleData } from '../services/storage';

/**
 * Performance testing utility for seeding data and measuring chart render time
 */

export async function seedPerformanceData(count: number = 60): Promise<void> {
  console.log(`[Performance Test] Seeding ${count} measurements...`);
  const startTime = performance.now();
  
  await generateSampleData(count);
  
  const endTime = performance.now();
  console.log(`[Performance Test] Seeded ${count} measurements in ${(endTime - startTime).toFixed(2)}ms`);
}

export function measureChartPaint(componentName: string): {
  start: () => void;
  end: () => void;
} {
  let startTime: number;
  
  return {
    start: () => {
      startTime = performance.now();
      console.log(`[Performance Test] ${componentName} render started`);
    },
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < 500;
      
      console.log(
        `[Performance Test] ${componentName} first paint: ${duration.toFixed(2)}ms ${passed ? '✅ PASS' : '❌ FAIL'} (target: <500ms)`
      );
      
      return { duration, passed };
    },
  };
}
