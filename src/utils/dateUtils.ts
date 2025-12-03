import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Calculate age in days from birth date to measurement date
 * Handles leap years correctly using dayjs
 *
 * @param birthDate ISO date string
 * @param measurementDate ISO date string
 * @returns Age in days
 */
export function calculateAgeInDays(birthDate: string, measurementDate: string): number {
  const birth = dayjs.utc(birthDate).startOf('day');
  const measurement = dayjs.utc(measurementDate).startOf('day');

  return measurement.diff(birth, 'day');
}

/**
 * Format age in days to human-readable format (e.g., "3 months 15 days")
 *
 * @param ageInDays Age in days
 * @returns Formatted string
 */
export function formatAge(ageInDays: number): string {
  const months = Math.floor(ageInDays / 30.4375); // Average days per month
  const days = Math.floor(ageInDays % 30.4375);

  if (months === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  if (days === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Get today's date as ISO string (UTC 00:00)
 */
export function getTodayISO(): string {
  return dayjs.utc().startOf('day').toISOString();
}

/**
 * Format ISO date string to display format
 */
export function formatDate(isoDate: string): string {
  return dayjs.utc(isoDate).format('MMM D, YYYY');
}

/**
 * Validate that a date is not in the future
 */
export function isValidMeasurementDate(date: string, birthDate: string): boolean {
  const measurementDate = dayjs.utc(date);
  const birth = dayjs.utc(birthDate);
  const today = dayjs.utc();

  return !measurementDate.isBefore(birth) && !measurementDate.isAfter(today);
}
