import {
  calculateZScore,
  zScoreToPercentile,
  calculatePercentile,
} from '../src/utils/percentileCalculations';

describe('Percentile Calculations', () => {
  describe('calculateZScore', () => {
    it('should calculate Z-score correctly for median value', () => {
      const zScore = calculateZScore(5, 0.2, 5, 0.1);
      expect(zScore).toBeCloseTo(0, 1);
    });

    it('should calculate Z-score for value above median', () => {
      const zScore = calculateZScore(6, 0.2, 5, 0.1);
      expect(zScore).toBeGreaterThan(0);
    });

    it('should calculate Z-score for value below median', () => {
      const zScore = calculateZScore(4, 0.2, 5, 0.1);
      expect(zScore).toBeLessThan(0);
    });

    it('should handle L ≈ 0 case (logarithmic formula)', () => {
      const zScore = calculateZScore(5.5, 0.0001, 5, 0.1);
      expect(zScore).toBeGreaterThan(0);
      expect(zScore).toBeLessThan(2);
    });
  });

  describe('zScoreToPercentile', () => {
    it('should convert Z-score of 0 to 50th percentile', () => {
      const percentile = zScoreToPercentile(0);
      expect(percentile).toBeCloseTo(50, 0);
    });

    it('should convert positive Z-score to percentile > 50', () => {
      const percentile = zScoreToPercentile(1);
      expect(percentile).toBeGreaterThan(50);
      expect(percentile).toBeLessThan(100);
    });

    it('should convert negative Z-score to percentile < 50', () => {
      const percentile = zScoreToPercentile(-1);
      expect(percentile).toBeLessThan(50);
      expect(percentile).toBeGreaterThan(0);
    });

    it('should handle extreme Z-scores', () => {
      expect(zScoreToPercentile(-4)).toBeCloseTo(0.02, 1);
      expect(zScoreToPercentile(4)).toBeCloseTo(99.98, 1);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentile for weight', () => {
      // Test with a typical 3-month-old boy weight (around 6kg)
      const percentile = calculatePercentile(6.3, 91, 'weight', 'male');
      expect(percentile).toBeDefined();
      expect(percentile).toBeGreaterThan(0);
      expect(percentile).toBeLessThan(100);
    });

    it('should calculate percentile for height', () => {
      // Test with a typical 3-month-old boy height (around 61cm)
      const percentile = calculatePercentile(61, 91, 'height', 'male');
      expect(percentile).toBeDefined();
      expect(percentile).toBeGreaterThan(0);
      expect(percentile).toBeLessThan(100);
    });

    it('should calculate percentile for head circumference', () => {
      // Test with a typical 3-month-old boy head circumference (around 40cm)
      const percentile = calculatePercentile(40, 91, 'head', 'male');
      expect(percentile).toBeDefined();
      expect(percentile).toBeGreaterThan(0);
      expect(percentile).toBeLessThan(100);
    });

    it('should return undefined for age out of range', () => {
      const percentile = calculatePercentile(10, 1000, 'weight', 'male'); // 1000 days > 24 months
      expect(percentile).toBeUndefined();
    });

    it('should calculate different percentiles for different genders', () => {
      const malePercentile = calculatePercentile(6, 91, 'weight', 'male');
      const femalePercentile = calculatePercentile(6, 91, 'weight', 'female');

      expect(malePercentile).toBeDefined();
      expect(femalePercentile).toBeDefined();
      // Same weight should generally be higher percentile for girls
      expect(femalePercentile!).toBeGreaterThan(malePercentile!);
    });
  });
});
