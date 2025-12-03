import { calculateAgeInDays, formatAge, isValidMeasurementDate } from '../src/utils/dateUtils';

describe('Date Utils', () => {
    describe('calculateAgeInDays', () => {
        it('should calculate age correctly for same day', () => {
            const birthDate = '2024-01-01T00:00:00.000Z';
            const measurementDate = '2024-01-01T00:00:00.000Z';
            expect(calculateAgeInDays(birthDate, measurementDate)).toBe(0);
        });

        it('should calculate age correctly for one day', () => {
            const birthDate = '2024-01-01T00:00:00.000Z';
            const measurementDate = '2024-01-02T00:00:00.000Z';
            expect(calculateAgeInDays(birthDate, measurementDate)).toBe(1);
        });

        it('should calculate age correctly for one month (30 days)', () => {
            const birthDate = '2024-01-01T00:00:00.000Z';
            const measurementDate = '2024-01-31T00:00:00.000Z';
            expect(calculateAgeInDays(birthDate, measurementDate)).toBe(30);
        });

        it('should handle leap years correctly', () => {
            const birthDate = '2024-02-28T00:00:00.000Z';
            const measurementDate = '2024-03-01T00:00:00.000Z';
            expect(calculateAgeInDays(birthDate, measurementDate)).toBe(2); // 2024 is a leap year
        });

        it('should calculate age correctly for one year', () => {
            const birthDate = '2023-01-01T00:00:00.000Z';
            const measurementDate = '2024-01-01T00:00:00.000Z';
            expect(calculateAgeInDays(birthDate, measurementDate)).toBe(365);
        });
    });

    describe('formatAge', () => {
        it('should format 0 days correctly', () => {
            expect(formatAge(0)).toBe('0 days');
        });

        it('should format 1 day correctly', () => {
            expect(formatAge(1)).toBe('1 day');
        });

        it('should format multiple days correctly', () => {
            expect(formatAge(15)).toBe('15 days');
        });

        it('should format approximately 1 month correctly', () => {
            const result = formatAge(31);
            expect(result).toContain('month');
        });

        it('should format months and days correctly', () => {
            const result = formatAge(45);
            expect(result).toContain('month');
            expect(result).toContain('day');
        });

        it('should format 6 months correctly', () => {
            const result = formatAge(183);
            expect(result).toContain('6 month');
        });
    });

    describe('isValidMeasurementDate', () => {
        it('should accept date equal to birth date', () => {
            const birthDate = '2024-01-01T00:00:00.000Z';
            const measurementDate = '2024-01-01T00:00:00.000Z';
            expect(isValidMeasurementDate(measurementDate, birthDate)).toBe(true);
        });

        it('should accept date after birth date', () => {
            const birthDate = '2024-01-01T00:00:00.000Z';
            const measurementDate = '2024-06-01T00:00:00.000Z';
            expect(isValidMeasurementDate(measurementDate, birthDate)).toBe(true);
        });

        it('should reject date before birth date', () => {
            const birthDate = '2024-01-01T00:00:00.000Z';
            const measurementDate = '2023-12-31T00:00:00.000Z';
            expect(isValidMeasurementDate(measurementDate, birthDate)).toBe(false);
        });
    });
});
