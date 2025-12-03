import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { GrowthMeasurement, BabyProfile } from '../types';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { getTodayISO, formatDate } from '../utils/dateUtils';
import { lbToKg, inToCm, kgToLb, cmToIn } from '../utils/unitConversion';
import { saveMeasurement } from '../services/storage';

interface MeasurementFormProps {
  profile: BabyProfile;
  existingMeasurement?: GrowthMeasurement;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  date: string;
  weight: string;
  height: string;
  head: string;
}

export default function MeasurementForm({
  profile,
  existingMeasurement,
  onSuccess,
  onCancel,
}: MeasurementFormProps) {
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [lengthUnit, setLengthUnit] = useState<'cm' | 'in'>('cm');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      date: existingMeasurement?.date.split('T')[0] || getTodayISO().split('T')[0],
      weight: existingMeasurement
        ? weightUnit === 'kg'
          ? existingMeasurement.weightKg.toFixed(2)
          : kgToLb(existingMeasurement.weightKg).toFixed(2)
        : '',
      height: existingMeasurement
        ? lengthUnit === 'cm'
          ? existingMeasurement.heightCm.toFixed(1)
          : cmToIn(existingMeasurement.heightCm).toFixed(2)
        : '',
      head: existingMeasurement
        ? lengthUnit === 'cm'
          ? existingMeasurement.headCm.toFixed(1)
          : cmToIn(existingMeasurement.headCm).toFixed(2)
        : '',
    },
  });

  const watchedWeight = watch('weight');
  const watchedHeight = watch('height');
  const watchedHead = watch('head');

  const toggleWeightUnit = () => {
    const currentValue = parseFloat(watchedWeight);
    if (!isNaN(currentValue)) {
      const newValue = weightUnit === 'kg' ? kgToLb(currentValue) : lbToKg(currentValue);
      setValue('weight', newValue.toFixed(2));
    }
    setWeightUnit(weightUnit === 'kg' ? 'lb' : 'kg');
  };

  const toggleLengthUnit = () => {
    const currentHeight = parseFloat(watchedHeight);
    const currentHead = parseFloat(watchedHead);

    if (!isNaN(currentHeight)) {
      const newHeight = lengthUnit === 'cm' ? cmToIn(currentHeight) : inToCm(currentHeight);
      setValue('height', newHeight.toFixed(lengthUnit === 'cm' ? 2 : 1));
    }

    if (!isNaN(currentHead)) {
      const newHead = lengthUnit === 'cm' ? cmToIn(currentHead) : inToCm(currentHead);
      setValue('head', newHead.toFixed(lengthUnit === 'cm' ? 2 : 1));
    }

    setLengthUnit(lengthUnit === 'cm' ? 'in' : 'cm');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      // Convert to SI units
      const weightKg =
        weightUnit === 'kg' ? parseFloat(data.weight) : lbToKg(parseFloat(data.weight));
      const heightCm =
        lengthUnit === 'cm' ? parseFloat(data.height) : inToCm(parseFloat(data.height));
      const headCm = lengthUnit === 'cm' ? parseFloat(data.head) : inToCm(parseFloat(data.head));

      const measurement = {
        id: existingMeasurement?.id || `measurement-${Date.now()}`,
        date: data.date + 'T00:00:00.000Z',
        weightKg: Math.round(weightKg * 1000) / 1000,
        heightCm: Math.round(heightCm * 100) / 100,
        headCm: Math.round(headCm * 100) / 100,
      };

      await saveMeasurement(measurement, profile);

      Alert.alert(
        'Success',
        existingMeasurement ? 'Measurement updated successfully' : 'Measurement added successfully',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch {
      Alert.alert('Error', 'Failed to save measurement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateWeight = (value: string) => {
    if (!value || value.trim() === '') return 'Weight is required';

    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num <= 0) return 'Weight must be greater than 0';

    const kg = weightUnit === 'kg' ? num : lbToKg(num);
    if (kg < 0.5) return `Weight too low (minimum 0.5 kg / ${kgToLb(0.5).toFixed(1)} lb)`;
    if (kg > 30) return `Weight too high (maximum 30 kg / ${kgToLb(30).toFixed(1)} lb)`;

    return true;
  };

  const validateHeight = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Height is required';
    if (num <= 0) return 'Height must be positive';

    const cm = lengthUnit === 'cm' ? num : inToCm(num);
    if (cm < 40 || cm > 120) return 'Height seems unrealistic (40-120 cm)';

    return true;
  };

  const validateHead = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Head circumference is required';
    if (num <= 0) return 'Head circumference must be positive';

    const cm = lengthUnit === 'cm' ? num : inToCm(num);
    if (cm < 30 || cm > 55) return 'Head circumference seems unrealistic (30-55 cm)';

    return true;
  };

  const validateDate = (value: string) => {
    if (!value) return 'Date is required';

    const dateStr = value + 'T00:00:00.000Z';
    const today = new Date();
    const selectedDate = new Date(dateStr);

    if (selectedDate > today) {
      return 'Date cannot be in the future';
    }

    return true;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {existingMeasurement ? 'Edit Measurement' : 'Add Measurement'}
          </Text>
        </View>

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <Controller
            control={control}
            name="date"
            rules={{ validate: validateDate }}
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, errors.date && styles.inputError]}
                  onPress={() => {
                    setTempDate(new Date(value + 'T00:00:00.000Z'));
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateText}>{formatDate(value + 'T00:00:00.000Z')}</Text>
                </TouchableOpacity>

                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Select Date</Text>
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={tempDate}
                          mode="date"
                          display="spinner"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) setTempDate(selectedDate);
                          }}
                          maximumDate={new Date()}
                          themeVariant="dark"
                          style={styles.picker}
                        />
                      </View>
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalCancelButton]}
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalConfirmButton]}
                          onPress={() => {
                            const dateStr = tempDate.toISOString().split('T')[0];
                            onChange(dateStr);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.modalConfirmText}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </>
            )}
          />
          {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}
        </View>

        {/* Weight Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Weight</Text>
            <TouchableOpacity style={styles.unitToggle} onPress={toggleWeightUnit}>
              <Text style={styles.unitToggleText}>{weightUnit}</Text>
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="weight"
            rules={{ validate: validateWeight }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.weight && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder={`Enter weight in ${weightUnit}`}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
          />
          {errors.weight && <Text style={styles.errorText}>{errors.weight.message}</Text>}
        </View>

        {/* Height Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Length/Height</Text>
            <TouchableOpacity style={styles.unitToggle} onPress={toggleLengthUnit}>
              <Text style={styles.unitToggleText}>{lengthUnit}</Text>
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="height"
            rules={{ validate: validateHeight }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.height && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder={`Enter height in ${lengthUnit}`}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
          />
          {errors.height && <Text style={styles.errorText}>{errors.height.message}</Text>}
        </View>

        {/* Head Circumference Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Head Circumference</Text>
            <Text style={styles.unitLabel}>{lengthUnit}</Text>
          </View>
          <Controller
            control={control}
            name="head"
            rules={{ validate: validateHead }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.head && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder={`Enter head circumference in ${lengthUnit}`}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
          />
          {errors.head && <Text style={styles.errorText}>{errors.head.message}</Text>}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.submitButtonText}>{existingMeasurement ? 'Update' : 'Save'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  unitLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  unitToggle: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  unitToggleText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 56,
    includeFontPadding: false,
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    ...typography.body,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...shadows.md,
  },
  cancelButton: {
    backgroundColor: colors.surfaceLight,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
  pickerContainer: {
    overflow: 'hidden',
  },
  picker: {
    height: 200,
    marginHorizontal: -22,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.surfaceLight,
  },
  modalCancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
  },
  modalConfirmText: {
    ...typography.button,
    color: colors.text,
  },
});
