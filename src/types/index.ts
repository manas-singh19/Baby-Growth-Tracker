export interface GrowthMeasurement {
  id: string;
  date: string; // ISO date string (UTC 00:00)
  ageInDays: number; // derived from birthDate -> date
  weightKg: number; // stored in SI units
  heightCm: number; // stored in SI units
  headCm: number; // stored in SI units
  weightPercentile?: number; // 0–100
  heightPercentile?: number;
  headPercentile?: number;
}

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string; // ISO date string
  gender: 'male' | 'female';
}

export interface StorageData {
  version: number;
  profile: BabyProfile;
  measurements: GrowthMeasurement[];
}

export type UnitSystem = 'metric' | 'imperial';

export interface WHODataPoint {
  age: number; // age in days
  L: number;
  M: number;
  S: number;
}

export type MeasurementType = 'weight' | 'height' | 'head';
