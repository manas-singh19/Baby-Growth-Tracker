import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BabyProfile, GrowthMeasurement, MeasurementType } from './src/types';
import {
  loadData,
  deleteMeasurement as deleteMeasurementFromStorage,
  generateSampleData,
} from './src/services/storage';
import MeasurementForm from './src/components/MeasurementForm';
import GrowthChart from './src/components/GrowthChart';
import HistoryList from './src/components/HistoryList';
import { colors, spacing, typography, borderRadius, shadows } from './src/theme';

type Screen = 'charts' | 'history' | 'add' | 'edit' | 'profile';

function AppContent() {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('charts');
  const [previousScreen, setPreviousScreen] = useState<Screen>('charts');
  const [selectedMeasurement, setSelectedMeasurement] = useState<GrowthMeasurement | null>(null);
  const [chartType, setChartType] = useState<MeasurementType>('weight');
  const [weightUnit] = useState<'kg' | 'lb'>('kg');
  const [lengthUnit] = useState<'cm' | 'in'>('cm');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentScreen]);

  const loadAppData = useCallback(async () => {
    try {
      const data = await loadData();
      setProfile(data.profile);
      setMeasurements(data.measurements);
    } catch {
      Alert.alert('Error', 'Failed to load data. Please restart the app.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddMeasurement = useCallback(() => {
    setSelectedMeasurement(null);
    setCurrentScreen('add');
  }, []);

  const handleEditMeasurement = useCallback((measurement: GrowthMeasurement) => {
    setSelectedMeasurement(measurement);
    setPreviousScreen(currentScreen);
    setCurrentScreen('edit');
  }, [currentScreen]);

  const handleDeleteMeasurement = useCallback(
    async (id: string) => {
      try {
        await deleteMeasurementFromStorage(id);
        await loadAppData();
      } catch {
        Alert.alert('Error', 'Failed to delete measurement.');
      }
    },
    [loadAppData]
  );

  const handleFormSuccess = useCallback(
    async () => {
      await loadAppData();
      setCurrentScreen(previousScreen);
      setSelectedMeasurement(null);
    },
    [previousScreen, loadAppData]
  );

  const handleFormCancel = useCallback(() => {
    setCurrentScreen(previousScreen);
    setSelectedMeasurement(null);
  }, [previousScreen]);

  const handleGenerateSampleData = () => {
    Alert.alert(
      'Generate Sample Data',
      'This will add 20 sample measurements for testing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              await generateSampleData(20);
              await loadAppData();
              Alert.alert('Success', 'Sample data generated!');
            } catch {
              Alert.alert('Error', 'Failed to generate sample data.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setCurrentScreen('profile')}>
        <Text style={styles.headerTitle}>{profile.name}&apos;s Growth</Text>
        <Text style={styles.headerSubtitle}>
          {profile.gender === 'male' ? '👶 Boy' : '👶 Girl'} • WHO Standards
        </Text>
      </TouchableOpacity>
      {currentScreen === 'charts' && measurements.length === 0 && (
        <TouchableOpacity style={styles.sampleButton} onPress={handleGenerateSampleData}>
          <Text style={styles.sampleButtonText}>📊 Demo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, currentScreen === 'charts' && styles.tabActive]}
        onPress={() => setCurrentScreen('charts')}
      >
        <Text style={[styles.tabText, currentScreen === 'charts' && styles.tabTextActive]}>
          📈 Charts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, currentScreen === 'history' && styles.tabActive]}
        onPress={() => setCurrentScreen('history')}
      >
        <Text style={[styles.tabText, currentScreen === 'history' && styles.tabTextActive]}>
          📋 History
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChartTypeSelector = () => (
    <View style={styles.chartTypeSelector}>
      <TouchableOpacity
        style={[styles.chartTypeButton, chartType === 'weight' && styles.chartTypeButtonActive]}
        onPress={() => setChartType('weight')}
      >
        <Text style={[styles.chartTypeText, chartType === 'weight' && styles.chartTypeTextActive]}>
          Weight
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.chartTypeButton, chartType === 'height' && styles.chartTypeButtonActive]}
        onPress={() => setChartType('height')}
      >
        <Text style={[styles.chartTypeText, chartType === 'height' && styles.chartTypeTextActive]}>
          Height
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.chartTypeButton, chartType === 'head' && styles.chartTypeButtonActive]}
        onPress={() => setChartType('head')}
      >
        <Text style={[styles.chartTypeText, chartType === 'head' && styles.chartTypeTextActive]}>
          Head
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChartsScreen = () => (
    <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderChartTypeSelector()}

        {measurements.length > 0 ? (
          <GrowthChart
            measurements={measurements}
            gender={profile.gender}
            type={chartType}
            unit={chartType === 'weight' ? weightUnit : lengthUnit}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Measurements Yet</Text>
            <Text style={styles.emptyStateText}>
              Start tracking your baby&apos;s growth by adding the first measurement.
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddMeasurement}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHistoryScreen = () => (
    <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
      <HistoryList
        measurements={measurements}
        onEdit={handleEditMeasurement}
        onDelete={handleDeleteMeasurement}
        weightUnit={weightUnit}
        lengthUnit={lengthUnit}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddMeasurement}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFormScreen = () => (
    <Animated.View
      style={[
        styles.screenContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <MeasurementForm
        profile={profile}
        existingMeasurement={selectedMeasurement || undefined}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </Animated.View>
  );

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all measurements and reset the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const { clearAllData } = await import('./src/services/storage');
              await clearAllData();
              await loadAppData();
              setCurrentScreen('charts');
              Alert.alert('Success', 'All data has been reset');
            } catch {
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  const renderProfileScreen = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.profileContainer}>
        <Text style={styles.profileTitle}>Baby Profile</Text>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Name</Text>
          <Text style={styles.profileValue}>{profile.name}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Gender</Text>
          <Text style={styles.profileValue}>
            {profile.gender === 'male' ? '👶 Boy' : '👶 Girl'}
          </Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Birth Date</Text>
          <Text style={styles.profileValue}>
            {new Date(profile.birthDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Total Measurements</Text>
          <Text style={styles.profileValue}>{measurements.length}</Text>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
          <Text style={styles.resetButtonText}>🗑️ Reset All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('charts')}>
          <Text style={styles.backButtonText}>← Back to Charts</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {renderHeader()}

        {(currentScreen === 'charts' || currentScreen === 'history') && renderTabBar()}

        {currentScreen === 'charts' && renderChartsScreen()}
        {currentScreen === 'history' && renderHistoryScreen()}
        {(currentScreen === 'add' || currentScreen === 'edit') && renderFormScreen()}
        {currentScreen === 'profile' && renderProfileScreen()}
      </SafeAreaView>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // This colors the status bar area
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    // paddingTop: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.8,
    borderBottomColor: colors.surfaceLight,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sampleButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sampleButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chartTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  chartTypeText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  chartTypeTextActive: {
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '300',
  },
  profileContainer: {
    padding: spacing.lg,
  },
  profileTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  profileItem: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  profileLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  profileValue: {
    ...typography.h3,
    color: colors.text,
  },
  resetButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.text,
  },
  backButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backButtonText: {
    ...typography.button,
    color: colors.text,
  },
});
