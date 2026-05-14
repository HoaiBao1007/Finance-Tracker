import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { formatMonthYear } from '@/lib/format';
import { financeFonts, getCategoryIconName } from '@/lib/finance-ui';
import { useSession } from '@/providers/session-provider';
import { budgetFormSchema, type BudgetFormValues } from '@/schemas/budget-form.schema';
import type { Budget, Category } from '@/types/finance';

const budgetSnapPoints = ['74%'];

type BudgetSheetMode = 'create' | 'edit';

export type BudgetSheetHandle = {
  openCreate: () => void;
  openEdit: (budget: Budget) => void;
  close: () => void;
};

type BudgetSheetProps = {
  categories: Category[];
  month: number;
  year: number;
};

function buildDefaultValues(categories: Category[], budget?: Budget | null): BudgetFormValues {
  return {
    categoryId: budget?.categoryId ?? categories[0]?.id ?? '',
    limitAmount: budget?.limitAmount ?? '',
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể kết nối backend lúc này.';
}

export const BudgetSheet = forwardRef<BudgetSheetHandle, BudgetSheetProps>(function BudgetSheet(
  { categories, month, year },
  ref,
) {
  const palette = getFinancePalette(useColorScheme());
  const queryClient = useQueryClient();
  const { sessionToken } = useSession();
  const modalRef = useRef<BottomSheetModal>(null);
  const [mode, setMode] = useState<BudgetSheetMode>('create');
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: buildDefaultValues(categories),
  });

  const periodLabel = formatMonthYear(editingBudget?.month ?? month, editingBudget?.year ?? year);

  const invalidateFinanceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-bundle', sessionToken] }),
      queryClient.invalidateQueries({ queryKey: ['budgets', sessionToken] }),
    ]);
  };

  const createBudgetMutation = useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      return financeApi.createBudget(
        {
          categoryId: values.categoryId,
          limitAmount: values.limitAmount.trim(),
          month,
          year,
        },
        sessionToken,
      );
    },
    onSuccess: async () => {
      await invalidateFinanceQueries();
      modalRef.current?.dismiss();
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      if (!editingBudget) {
        throw new Error('Không tìm thấy ngân sách cần chỉnh sửa');
      }

      return financeApi.updateBudget(
        editingBudget.id,
        {
          categoryId: values.categoryId,
          limitAmount: values.limitAmount.trim(),
        },
        sessionToken,
      );
    },
    onSuccess: async () => {
      await invalidateFinanceQueries();
      modalRef.current?.dismiss();
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      return financeApi.deleteBudget(budgetId, sessionToken);
    },
    onSuccess: async () => {
      await invalidateFinanceQueries();
      modalRef.current?.dismiss();
    },
  });

  const isSubmitting =
    createBudgetMutation.isPending || updateBudgetMutation.isPending || deleteBudgetMutation.isPending;
  const activeError = deleteBudgetMutation.error ?? updateBudgetMutation.error ?? createBudgetMutation.error;

  const resetState = () => {
    setMode('create');
    setEditingBudget(null);
    createBudgetMutation.reset();
    updateBudgetMutation.reset();
    deleteBudgetMutation.reset();
    reset(buildDefaultValues(categories));
  };

  function openCreate() {
    setMode('create');
    setEditingBudget(null);
    createBudgetMutation.reset();
    updateBudgetMutation.reset();
    deleteBudgetMutation.reset();
    reset(buildDefaultValues(categories));
    modalRef.current?.present();
  }

  function openEdit(budget: Budget) {
    setMode('edit');
    setEditingBudget(budget);
    createBudgetMutation.reset();
    updateBudgetMutation.reset();
    deleteBudgetMutation.reset();
    reset(buildDefaultValues(categories, budget));
    modalRef.current?.present();
  }

  function close() {
    modalRef.current?.dismiss();
  }

  useImperativeHandle(ref, () => ({ openCreate, openEdit, close }), [categories, reset]);

  const handleBudgetSubmit = handleSubmit(async (values) => {
    if (mode === 'edit') {
      await updateBudgetMutation.mutateAsync(values);
      return;
    }

    await createBudgetMutation.mutateAsync(values);
  });

  const handleDelete = () => {
    if (!editingBudget || isSubmitting) {
      return;
    }

    Alert.alert('Xóa ngân sách?', 'Ngân sách này sẽ bị xóa khỏi danh sách và màn hình tổng quan.', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          void deleteBudgetMutation.mutateAsync(editingBudget.id);
        },
      },
    ]);
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={budgetSnapPoints}
      enablePanDownToClose
      onDismiss={resetState}
      handleIndicatorStyle={{ backgroundColor: palette.border }}
      backgroundStyle={{ backgroundColor: palette.surface, borderRadius: 32 }}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>{mode === 'create' ? 'Tạo ngân sách' : 'Chỉnh sửa ngân sách'}</Text>
          <Text style={[styles.title, { color: palette.text }]}>
            {mode === 'create' ? 'Thêm ngân sách cho kỳ hiện tại' : 'Cập nhật ngân sách đang theo dõi'}
          </Text>
          <Text style={[styles.description, { color: palette.mutedText }]}>Ngân sách này áp dụng cho kỳ {periodLabel} và chỉ dành cho danh mục chi tiêu.</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Danh mục chi tiêu</Text>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.categoryGrid}>
                {categories.map((category) => {
                  const isActive = value === category.id;

                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => onChange(category.id)}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        {
                          backgroundColor: isActive ? palette.accentSoft : palette.surfaceMuted,
                          borderColor: isActive ? palette.accent : palette.border,
                          opacity: pressed ? 0.86 : 1,
                        },
                      ]}
                    >
                        <View style={styles.categoryChipContent}>
                          <FontAwesome
                            name={getCategoryIconName(category.name, 'expense')}
                            size={14}
                            color={isActive ? palette.accent : palette.text}
                          />
                          <Text style={[styles.categoryChipText, { color: isActive ? palette.accent : palette.text }]}>
                            {category.name}
                          </Text>
                        </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          {errors.categoryId ? <Text style={[styles.errorText, { color: palette.danger }]}>{errors.categoryId.message}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Hạn mức</Text>
          <Controller
            control={control}
            name="limitAmount"
            render={({ field: { onBlur, onChange, value } }) => (
              <BottomSheetTextInput
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="number-pad"
                placeholder="Ví dụ: 2500000"
                placeholderTextColor={palette.mutedText}
                selectionColor={palette.accent}
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: errors.limitAmount ? palette.danger : palette.border,
                    color: palette.text,
                  },
                ]}
              />
            )}
          />
          {errors.limitAmount ? <Text style={[styles.errorText, { color: palette.danger }]}>{errors.limitAmount.message}</Text> : null}
        </View>

        <View style={[styles.periodCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}> 
          <Text style={[styles.periodTitle, { color: palette.text }]}>Kỳ áp dụng</Text>
          <Text style={[styles.periodText, { color: palette.mutedText }]}>{periodLabel}</Text>
        </View>

        {activeError ? (
          <View style={[styles.inlineState, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
            <Text style={[styles.inlineStateText, { color: palette.danger }]}>{getErrorMessage(activeError)}</Text>
          </View>
        ) : null}

        {mode === 'edit' ? (
          <Pressable
            onPress={handleDelete}
            disabled={isSubmitting || !editingBudget}
            style={({ pressed }) => [
              styles.deleteButton,
              {
                backgroundColor: palette.danger,
                opacity: isSubmitting || !editingBudget ? 0.65 : pressed ? 0.86 : 1,
              },
            ]}
          >
            {deleteBudgetMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.deleteButtonText}>Xóa ngân sách</Text>
            )}
          </Pressable>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            onPress={close}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Hủy</Text>
          </Pressable>

          <Pressable
            onPress={() => void handleBudgetSubmit()}
            disabled={isSubmitting || categories.length === 0 || !sessionToken}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: palette.accent,
                opacity: isSubmitting || categories.length === 0 || !sessionToken ? 0.6 : pressed ? 0.86 : 1,
              },
            ]}
          >
            {createBudgetMutation.isPending || updateBudgetMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>{mode === 'create' ? 'Tạo ngân sách' : 'Lưu thay đổi'}</Text>
            )}
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 36,
    gap: 18,
  },
  header: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: financeFonts.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontFamily: financeFonts.extrabold,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: financeFonts.regular,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  input: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: financeFonts.medium,
  },
  periodCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  periodTitle: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: financeFonts.regular,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
  inlineState: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inlineStateText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
  deleteButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 6,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  primaryButton: {
    flex: 1.2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
});