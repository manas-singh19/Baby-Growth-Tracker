import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { GrowthMeasurement } from '../types';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatDate, formatAge } from '../utils/dateUtils';
import { formatWeight, formatHeight } from '../utils/unitConversion';

interface HistoryListProps {
  measurements: GrowthMeasurement[];
  onEdit: (measurement: GrowthMeasurement) => void;
  onDelete: (id: string) => void;
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
}

export default function HistoryList({
  measurements,
  onEdit,
  onDelete,
  weightUnit,
  lengthUnit,
}: HistoryListProps) {
  const handleDelete = (measurement: GrowthMeasurement) => {
    Alert.alert(
      'Delete Measurement',
      `Are you sure you want to delete the measurement from ${formatDate(measurement.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(measurement.id),
        },
      ]
    );
  };

  const renderPercentile = (percentile: number | undefined) => {
    if (percentile === undefined) return 'N/A';

    let color = colors.textMuted;
    if (percentile < 3 || percentile > 97) {
      color = colors.warning;
    } else if (percentile >= 25 && percentile <= 75) {
      color = colors.success;
    }

    return <Text style={[styles.percentileText, { color }]}>{percentile.toFixed(1)}th</Text>;
  };

  const renderItem = ({ item }: { item: GrowthMeasurement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text style={styles.ageText}>{formatAge(item.ageInDays)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.measurements}>
        <View style={styles.measurementItem}>
          <Text style={styles.measurementLabel}>Weight</Text>
          <Text style={styles.measurementValue}>{formatWeight(item.weightKg, weightUnit)}</Text>
          {renderPercentile(item.weightPercentile)}
        </View>

        <View style={styles.measurementItem}>
          <Text style={styles.measurementLabel}>Height</Text>
          <Text style={styles.measurementValue}>{formatHeight(item.heightCm, lengthUnit)}</Text>
          {renderPercentile(item.heightPercentile)}
        </View>

        <View style={styles.measurementItem}>
          <Text style={styles.measurementLabel}>Head</Text>
          <Text style={styles.measurementValue}>{formatHeight(item.headCm, lengthUnit)}</Text>
          {renderPercentile(item.headPercentile)}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Measurements Yet</Text>
      <Text style={styles.emptyText}>
        Tap the &quot;Add Measurement&quot; button to record your baby&apos;s first growth
        measurement.
      </Text>
    </View>
  );

  // Sort by date, newest first
  const sortedMeasurements = [...measurements].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <FlatList
      data={sortedMeasurements}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={<View style={{ height: 80 }} />}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  dateText: {
    ...typography.h3,
    color: colors.text,
  },
  ageText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  measurements: {
    gap: spacing.md,
  },
  measurementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  measurementLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  measurementValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  percentileText: {
    ...typography.body,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
