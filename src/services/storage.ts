import AsyncStorage from '@react-native-async-storage/async-storage';
import { BabyProfile, GrowthMeasurement, StorageData } from '../types';
import { calculateAgeInDays } from '../utils/dateUtils';
import { calculatePercentile } from '../utils/percentileCalculations';

const STORAGE_KEY = 'growth/v1/data';
const CURRENT_VERSION = 1;

/**
 * Default baby profile for demo purposes
 */
const DEFAULT_PROFILE: BabyProfile = {
    id: 'baby-1',
    name: 'Baby',
    birthDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z', // 6 months ago
    gender: 'female',
};

/**
 * Load data from AsyncStorage
 */
export async function loadData(): Promise<StorageData> {
    try {
        const jsonData = await AsyncStorage.getItem(STORAGE_KEY);

        if (!jsonData) {
            // Return default data if nothing stored
            return {
                version: CURRENT_VERSION,
                profile: DEFAULT_PROFILE,
                measurements: [],
            };
        }

        const data = JSON.parse(jsonData) as StorageData;

        // Handle migrations if needed
        if (data.version < CURRENT_VERSION) {
            return migrateData(data);
        }

        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        // Return default data on error
        return {
            version: CURRENT_VERSION,
            profile: DEFAULT_PROFILE,
            measurements: [],
        };
    }
}

/**
 * Save data to AsyncStorage
 */
export async function saveData(data: StorageData): Promise<void> {
    try {
        const jsonData = JSON.stringify(data);
        await AsyncStorage.setItem(STORAGE_KEY, jsonData);
    } catch (error) {
        console.error('Error saving data:', error);
        throw new Error('Failed to save data');
    }
}

/**
 * Add or update a measurement
 * Calculates age and percentiles automatically
 */
export async function saveMeasurement(
    measurement: Omit<GrowthMeasurement, 'ageInDays' | 'weightPercentile' | 'heightPercentile' | 'headPercentile'>,
    profile: BabyProfile
): Promise<GrowthMeasurement> {
    const data = await loadData();

    // Calculate age in days
    const ageInDays = calculateAgeInDays(profile.birthDate, measurement.date);

    // Calculate percentiles
    const weightPercentile = calculatePercentile(
        measurement.weightKg,
        ageInDays,
        'weight',
        profile.gender
    );

    const heightPercentile = calculatePercentile(
        measurement.heightCm,
        ageInDays,
        'height',
        profile.gender
    );

    const headPercentile = calculatePercentile(
        measurement.headCm,
        ageInDays,
        'head',
        profile.gender
    );

    const completeMeasurement: GrowthMeasurement = {
        ...measurement,
        ageInDays,
        weightPercentile,
        heightPercentile,
        headPercentile,
    };

    // Check if updating existing measurement
    const existingIndex = data.measurements.findIndex(m => m.id === measurement.id);

    if (existingIndex >= 0) {
        data.measurements[existingIndex] = completeMeasurement;
    } else {
        data.measurements.push(completeMeasurement);
    }

    // Sort by date (oldest first)
    data.measurements.sort((a, b) => a.date.localeCompare(b.date));

    await saveData(data);

    return completeMeasurement;
}

/**
 * Delete a measurement
 */
export async function deleteMeasurement(id: string): Promise<void> {
    const data = await loadData();
    data.measurements = data.measurements.filter(m => m.id !== id);
    await saveData(data);
}

/**
 * Update baby profile
 */
export async function updateProfile(profile: BabyProfile): Promise<void> {
    const data = await loadData();
    data.profile = profile;

    // Recalculate all percentiles with new profile
    data.measurements = data.measurements.map(m => {
        const ageInDays = calculateAgeInDays(profile.birthDate, m.date);

        return {
            ...m,
            ageInDays,
            weightPercentile: calculatePercentile(m.weightKg, ageInDays, 'weight', profile.gender),
            heightPercentile: calculatePercentile(m.heightCm, ageInDays, 'height', profile.gender),
            headPercentile: calculatePercentile(m.headCm, ageInDays, 'head', profile.gender),
        };
    });

    await saveData(data);
}

/**
 * Clear all data (for recovery)
 */
export async function clearAllData(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing data:', error);
        throw new Error('Failed to clear data');
    }
}

/**
 * Migrate data from older versions
 */
function migrateData(data: StorageData): StorageData {
    // Future migrations would go here
    return {
        ...data,
        version: CURRENT_VERSION,
    };
}

/**
 * Generate sample data for testing
 */
export async function generateSampleData(count: number = 20): Promise<void> {
    const data = await loadData();
    const profile = data.profile;

    const measurements: GrowthMeasurement[] = [];
    const startDate = new Date(profile.birthDate);

    for (let i = 0; i < count; i++) {
        const daysOffset = Math.floor((i / count) * 730); // Spread over 2 years
        const measurementDate = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        const ageInDays = calculateAgeInDays(profile.birthDate, measurementDate.toISOString());

        // Generate realistic values with some variation
        const baseWeight = 3.3 + (ageInDays / 730) * 9; // Rough growth curve
        const baseHeight = 50 + (ageInDays / 730) * 37;
        const baseHead = 34 + (ageInDays / 730) * 14;

        const weightKg = baseWeight + (Math.random() - 0.5) * 0.5;
        const heightCm = baseHeight + (Math.random() - 0.5) * 2;
        const headCm = baseHead + (Math.random() - 0.5) * 1;

        const weightPercentile = calculatePercentile(weightKg, ageInDays, 'weight', profile.gender);
        const heightPercentile = calculatePercentile(heightCm, ageInDays, 'height', profile.gender);
        const headPercentile = calculatePercentile(headCm, ageInDays, 'head', profile.gender);

        measurements.push({
            id: `sample-${i}`,
            date: measurementDate.toISOString().split('T')[0] + 'T00:00:00.000Z',
            ageInDays,
            weightKg: Math.round(weightKg * 1000) / 1000,
            heightCm: Math.round(heightCm * 100) / 100,
            headCm: Math.round(headCm * 100) / 100,
            weightPercentile,
            heightPercentile,
            headPercentile,
        });
    }

    data.measurements = measurements;
    await saveData(data);
}
