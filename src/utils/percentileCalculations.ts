import { WHODataPoint, MeasurementType } from '../types';
import {
  WHO_WEIGHT_FOR_AGE_BOYS,
  WHO_WEIGHT_FOR_AGE_GIRLS,
  WHO_HEIGHT_FOR_AGE_BOYS,
  WHO_HEIGHT_FOR_AGE_GIRLS,
  WHO_HEAD_FOR_AGE_BOYS,
  WHO_HEAD_FOR_AGE_GIRLS,
} from '../data/whoData';

/**
 * Calculate Z-score using WHO LMS method
 *
 * Z = [(value/M)^L - 1] / (L * S)
 *
 * Special case when L = 0:
 * Z = ln(value/M) / S
 *
 * @param value Measured value (kg or cm)
 * @param L Box-Cox transformation parameter
 * @param M Median
 * @param S Coefficient of variation
 * @returns Z-score
 */
export function calculateZScore(value: number, L: number, M: number, S: number): number {
  if (Math.abs(L) < 0.0001) {
    // L ≈ 0, use logarithmic formula
    return Math.log(value / M) / S;
  }

  return (Math.pow(value / M, L) - 1) / (L * S);
}

/**
 * Convert Z-score to percentile using standard normal distribution
 * Uses approximation formula for cumulative distribution function
 *
 * @param zScore Z-score
 * @returns Percentile (0-100)
 */
export function zScoreToPercentile(zScore: number): number {
  // Clamp extreme values
  if (zScore < -3.5) return 0.02;
  if (zScore > 3.5) return 99.98;

  // Approximation of cumulative distribution function
  const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
  const d = 0.3989423 * Math.exp((-zScore * zScore) / 2);
  const probability =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  const percentile = zScore > 0 ? (1 - probability) * 100 : probability * 100;

  return Math.round(percentile * 100) / 100; // Round to 2 decimal places
}

/**
 * Linear interpolation between two WHO data points
 *
 * @param age Age in days
 * @param point1 Earlier data point
 * @param point2 Later data point
 * @returns Interpolated LMS values
 */
function interpolateLMS(
  age: number,
  point1: WHODataPoint,
  point2: WHODataPoint
): { L: number; M: number; S: number } {
  const ratio = (age - point1.age) / (point2.age - point1.age);

  return {
    L: point1.L + ratio * (point2.L - point1.L),
    M: point1.M + ratio * (point2.M - point1.M),
    S: point1.S + ratio * (point2.S - point1.S),
  };
}

/**
 * Get WHO reference data for specific measurement type and gender
 */
function getWHOData(type: MeasurementType, gender: 'male' | 'female'): WHODataPoint[] {
  if (type === 'weight') {
    return gender === 'male' ? WHO_WEIGHT_FOR_AGE_BOYS : WHO_WEIGHT_FOR_AGE_GIRLS;
  } else if (type === 'height') {
    return gender === 'male' ? WHO_HEIGHT_FOR_AGE_BOYS : WHO_HEIGHT_FOR_AGE_GIRLS;
  } else {
    return gender === 'male' ? WHO_HEAD_FOR_AGE_BOYS : WHO_HEAD_FOR_AGE_GIRLS;
  }
}

/**
 * Calculate percentile for a measurement using WHO LMS method
 *
 * @param value Measured value (kg for weight, cm for height/head)
 * @param ageInDays Age in days
 * @param type Measurement type
 * @param gender Baby's gender
 * @returns Percentile (0-100) or undefined if out of range
 */
export function calculatePercentile(
  value: number,
  ageInDays: number,
  type: MeasurementType,
  gender: 'male' | 'female'
): number | undefined {
  const data = getWHOData(type, gender);

  // Check if age is within range
  if (ageInDays < data[0].age || ageInDays > data[data.length - 1].age) {
    return undefined;
  }

  // Find surrounding data points
  let lowerIndex = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].age <= ageInDays && data[i + 1].age >= ageInDays) {
      lowerIndex = i;
      break;
    }
  }

  const point1 = data[lowerIndex];
  const point2 = data[lowerIndex + 1];

  // Interpolate LMS values
  const lms =
    ageInDays === point1.age
      ? point1
      : ageInDays === point2.age
        ? point2
        : interpolateLMS(ageInDays, point1, point2);

  // Calculate Z-score and convert to percentile
  const zScore = calculateZScore(value, lms.L, lms.M, lms.S);
  return zScoreToPercentile(zScore);
}

/**
 * Get percentile curve data for charting
 * Returns value at each age for a specific percentile
 *
 * @param percentile Target percentile (e.g., 50 for median)
 * @param type Measurement type
 * @param gender Baby's gender
 * @returns Array of {age, value} points
 */
export function getPercentileCurve(
  percentile: number,
  type: MeasurementType,
  gender: 'male' | 'female'
): Array<{ age: number; value: number }> {
  const data = getWHOData(type, gender);

  // Convert percentile to Z-score
  // This is inverse of zScoreToPercentile
  const zScore = percentileToZScore(percentile);

  return data.map(point => {
    // Calculate value from Z-score using inverse LMS formula
    let value: number;

    if (Math.abs(point.L) < 0.0001) {
      // L ≈ 0
      value = point.M * Math.exp(zScore * point.S);
    } else {
      value = point.M * Math.pow(1 + point.L * point.S * zScore, 1 / point.L);
    }

    return {
      age: point.age,
      value: Math.round(value * 100) / 100,
    };
  });
}

/**
 * Convert percentile to Z-score (inverse of zScoreToPercentile)
 * Uses approximation
 */
function percentileToZScore(percentile: number): number {
  // Clamp to valid range
  percentile = Math.max(0.01, Math.min(99.99, percentile));

  const p = percentile / 100;

  // Rational approximation for inverse normal CDF
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;

  let t: number;
  let sign: number;

  if (p < 0.5) {
    t = Math.sqrt(-2 * Math.log(p));
    sign = -1;
  } else {
    t = Math.sqrt(-2 * Math.log(1 - p));
    sign = 1;
  }

  const numerator = c0 + c1 * t + c2 * t * t;
  const denominator = 1 + d1 * t + d2 * t * t + d3 * t * t * t;

  return sign * (t - numerator / denominator);
}
