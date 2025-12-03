/**
 * Unit conversion utilities
 * All conversions maintain precision and use consistent rounding rules
 */

// Conversion constants
const KG_TO_LB = 2.20462;
const LB_TO_KG = 1 / KG_TO_LB;
const CM_TO_IN = 0.393701;
const IN_TO_CM = 1 / CM_TO_IN;

/**
 * Convert kilograms to pounds
 * Rounds to 2 decimal places
 */
export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 100) / 100;
}

/**
 * Convert pounds to kilograms
 * Rounds to 3 decimal places for storage
 */
export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG * 1000) / 1000;
}

/**
 * Convert centimeters to inches
 * Rounds to 2 decimal places
 */
export function cmToIn(cm: number): number {
  return Math.round(cm * CM_TO_IN * 100) / 100;
}

/**
 * Convert inches to centimeters
 * Rounds to 2 decimal places for storage
 */
export function inToCm(inches: number): number {
  return Math.round(inches * IN_TO_CM * 100) / 100;
}

/**
 * Format weight for display
 */
export function formatWeight(kg: number, unit: 'kg' | 'lb'): string {
  if (unit === 'lb') {
    return `${kgToLb(kg).toFixed(2)} lb`;
  }
  return `${kg.toFixed(2)} kg`;
}

/**
 * Format length/height for display
 */
export function formatHeight(cm: number, unit: 'cm' | 'in'): string {
  if (unit === 'in') {
    return `${cmToIn(cm).toFixed(2)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}
