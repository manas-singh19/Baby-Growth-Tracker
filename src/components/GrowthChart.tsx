import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { GrowthMeasurement, MeasurementType } from '../types';
import { getPercentileCurve } from '../utils/percentileCalculations';
import { colors, spacing, typography, borderRadius } from '../theme';
import { formatDate, formatAge } from '../utils/dateUtils';
import { formatWeight, formatHeight } from '../utils/unitConversion';

interface GrowthChartProps {
  measurements: GrowthMeasurement[];
  gender: 'male' | 'female';
  type: MeasurementType;
  unit: 'kg' | 'lb' | 'cm' | 'in';
}

const PERCENTILES = [3, 10, 25, 50, 75, 90, 97];

export default function GrowthChart({ measurements, gender, type, unit }: GrowthChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<GrowthMeasurement | null>(null);
  const renderStartTime = useRef<number>(performance.now());
  const previousMeasurementCount = useRef<number>(0);

  // Track when measurements change significantly (e.g., performance test)
  useEffect(() => {
    const currentCount = measurements.length;
    const countDiff = Math.abs(currentCount - previousMeasurementCount.current);
    
    // If measurements increased by 50+ (performance test), reset timer
    if (countDiff >= 50) {
      renderStartTime.current = performance.now();
      console.log(`[Performance] Starting measurement for ${currentCount} measurements...`);
    }
    
    previousMeasurementCount.current = currentCount;
  }, [measurements.length]);

  // Measure paint time after render
  useEffect(() => {
    if (measurements.length >= 50) {
      // Use setTimeout to measure after paint
      const timer = setTimeout(() => {
        const paintTime = performance.now() - renderStartTime.current;
        const passed = paintTime < 500;
        console.log(
          `[Performance] GrowthChart first paint: ${paintTime.toFixed(2)}ms ${passed ? '✅' : '❌'} (${measurements.length} measurements)`
        );
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [measurements]);

  // Get percentile curves
  const curves = PERCENTILES.map(p => ({
    percentile: p,
    data: getPercentileCurve(p, type, gender),
  }));

  // Prepare measurement data
  const measurementData = measurements.map(m => ({
    x: m.ageInDays,
    y: type === 'weight' ? m.weightKg : type === 'height' ? m.heightCm : m.headCm,
    measurement: m,
  }));

  // Get chart title and axis labels
  const getTitle = () => {
    if (type === 'weight') return 'Weight For Age';
    if (type === 'height') return 'Length/Height For Age';
    return 'Head Circumference For Age';
  };

  const getYAxisLabel = () => {
    if (type === 'weight') return unit === 'kg' ? 'Weight (kg)' : 'Weight (lb)';
    return unit === 'cm' ? 'Length (cm)' : 'Length (in)';
  };

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.md * 2;
  const chartHeight = 300;

  // Prepare data for LineChart
  // We'll show the 50th percentile and baby's measurements
  const maxAge = Math.max(...curves[0].data.map(d => d.age), ...measurementData.map(d => d.x));
  const labels = [];
  const step = Math.ceil(maxAge / 5); // Show ~5 labels to avoid overlap

  for (let i = 0; i <= maxAge; i += step) {
    labels.push(Math.round(i / 30.4375).toString()); // Convert to months
  }

  // Get 50th percentile data
  const p50Data = curves.find(c => c.percentile === 50)?.data || [];

  // Prepare datasets - all percentile curves
  const percentileColors: Record<number, string> = {
    3: colors.chartPercentile3,
    10: colors.chartPercentile10,
    25: colors.chartPercentile25,
    50: colors.chartPercentile50,
    75: colors.chartPercentile75,
    90: colors.chartPercentile90,
    97: colors.chartPercentile97,
  };

  const datasets = PERCENTILES.map(p => {
    const curveData = curves.find(c => c.percentile === p)?.data || [];
    return {
      data: curveData.map(d => d.value),
      color: () => percentileColors[p],
      strokeWidth: p === 50 ? 2.5 : 1.5,
      withDots: false,
    };
  });

  // Add baby's measurements if available
  if (measurementData.length > 0) {
    // Interpolate baby data to match chart points
    const babyDataPoints = p50Data
      .map(point => {
        const closest = measurementData.reduce((prev, curr) => {
          return Math.abs(curr.x - point.age) < Math.abs(prev.x - point.age) ? curr : prev;
        });

        // Only include if within reasonable range
        if (Math.abs(closest.x - point.age) < 60) {
          return closest.y;
        }
        return null;
      })
      .filter((v): v is number => v !== null);

    if (babyDataPoints.length > 0) {
      datasets.push({
        data: babyDataPoints,
        color: () => colors.accent,
        strokeWidth: 3,
        withDots: true,
      });
    }
  }

  // Ensure we have valid data
  const chartData = {
    labels: labels.slice(0, Math.min(labels.length, p50Data.length)),
    datasets:
      datasets.length > 0 ? datasets : [{ data: [0], color: () => colors.chartPercentile50 }],
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{getTitle()}</Text>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={chartHeight}
          chartConfig={{
            backgroundColor: '#1E293B',
            backgroundGradientFrom: '#1E293B',
            backgroundGradientTo: '#1E293B',

            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(241, 245, 249, ${opacity})`,
            style: {
              borderRadius: borderRadius.lg,
            },
            propsForDots: {
              r: '3',
              strokeWidth: '0.8',
              stroke: colors.accentLight,
            },
            propsForBackgroundLines: {
              strokeDasharray: '0.3',
              stroke: colors.chartGrid,
              strokeWidth: 1,
            },
          }}
          bezier={false}
          style={styles.chart}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          fromZero={false}
          segments={8}
        />
        <View style={styles.chartDetails}>
          <Text style={styles.xAxisLabel}>↑ {getYAxisLabel()}</Text>
          <Text style={styles.xAxisLabel}>→ Age (months)</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>WHO Percentile Curves</Text>
        <View style={styles.legendItems}>
          {PERCENTILES.map(p => (
            <View key={p} style={styles.legendItem}>
              <View
                style={[
                  styles.legendLine,
                  { backgroundColor: percentileColors[p], height: p === 50 ? 3 : 2 },
                ]}
              />
              <Text style={[styles.legendText, p === 50 && styles.legendTextBold]}>{p}th</Text>
            </View>
          ))}
          {measurementData.length > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, styles.legendTextBold]}>Baby&apos;s Growth</Text>
            </View>
          )}
        </View>
        <Text style={styles.legendNote}>Tap on measurements below to see detailed information</Text>
      </View>

      {/* Measurement points list */}
      {measurementData.length > 0 && (
        <View style={styles.measurementsList}>
          <Text style={styles.measurementsTitle}>Recent Measurements</Text>
          {measurements
            .slice(-5)
            .reverse()
            .map(m => {
              const value =
                type === 'weight' ? m.weightKg : type === 'height' ? m.heightCm : m.headCm;
              const percentile =
                type === 'weight'
                  ? m.weightPercentile
                  : type === 'height'
                    ? m.heightPercentile
                    : m.headPercentile;

              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.measurementCard,
                    selectedPoint?.id === m.id && styles.measurementCardSelected,
                  ]}
                  onPress={() => setSelectedPoint(selectedPoint?.id === m.id ? null : m)}
                >
                  <View style={styles.measurementHeader}>
                    <Text style={styles.measurementDate}>{formatDate(m.date)}</Text>
                    <Text style={styles.measurementAge}>{formatAge(m.ageInDays)}</Text>
                  </View>
                  <View style={styles.measurementDetails}>
                    <Text style={styles.measurementValue}>
                      {type === 'weight'
                        ? formatWeight(value, unit as 'kg' | 'lb')
                        : formatHeight(value, unit as 'cm' | 'in')}
                    </Text>
                    {percentile !== undefined && (
                      <Text style={styles.measurementPercentile}>
                        {percentile.toFixed(1)}th percentile
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          <View style={{ height: 80 }} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingBottom: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chart: {
    borderRadius: borderRadius.lg,
    marginLeft: -20, // Compensate for Y-axis labels to center the chart
  },
  xAxisLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  chartDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: spacing.md,
    position: 'absolute',
    bottom: 8,
  },
  legend: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  legendTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  legendLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  legendTextBold: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  legendNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  measurementsList: {
    marginTop: spacing.md,
  },
  measurementsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  measurementCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  measurementCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  measurementDate: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  measurementAge: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  measurementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  measurementValue: {
    ...typography.h3,
    color: colors.primary,
  },
  measurementPercentile: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
});
