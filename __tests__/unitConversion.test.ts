import { kgToLb, lbToKg, cmToIn, inToCm } from '../src/utils/unitConversion';

describe('Unit Conversion', () => {
    describe('Weight Conversion', () => {
        it('should convert kg to lb correctly', () => {
            expect(kgToLb(1)).toBeCloseTo(2.20, 2);
            expect(kgToLb(5)).toBeCloseTo(11.02, 2);
            expect(kgToLb(10)).toBeCloseTo(22.05, 2);
        });

        it('should convert lb to kg correctly', () => {
            expect(lbToKg(2.20)).toBeCloseTo(1, 2);
            expect(lbToKg(11.02)).toBeCloseTo(5, 2);
            expect(lbToKg(22.05)).toBeCloseTo(10, 2);
        });

        it('should maintain precision in round-trip conversion', () => {
            const originalKg = 7.5;
            const lb = kgToLb(originalKg);
            const backToKg = lbToKg(lb);
            expect(backToKg).toBeCloseTo(originalKg, 2);
        });
    });

    describe('Length Conversion', () => {
        it('should convert cm to in correctly', () => {
            expect(cmToIn(10)).toBeCloseTo(3.94, 2);
            expect(cmToIn(50)).toBeCloseTo(19.69, 2);
            expect(cmToIn(100)).toBeCloseTo(39.37, 2);
        });

        it('should convert in to cm correctly', () => {
            expect(inToCm(3.94)).toBeCloseTo(10, 1);
            expect(inToCm(19.69)).toBeCloseTo(50, 1);
            expect(inToCm(39.37)).toBeCloseTo(100, 1);
        });

        it('should maintain precision in round-trip conversion', () => {
            const originalCm = 65.5;
            const inches = cmToIn(originalCm);
            const backToCm = inToCm(inches);
            expect(backToCm).toBeCloseTo(originalCm, 1);
        });
    });
});
