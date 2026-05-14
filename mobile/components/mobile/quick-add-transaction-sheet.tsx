import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { toDateInputValue } from '@/lib/format';
import { financeFonts, getCategoryIconName } from '@/lib/finance-ui';
import { useSession } from '@/providers/session-provider';
import {
  quickAddTransactionSchema,
  type QuickAddTransactionValues,
} from '@/schemas/quick-add-transaction.schema';
import type { Category, Transaction, TransactionType } from '@/types/finance';

const quickAddSnapPoints = ['82%'];

type TransactionSheetMode = 'create' | 'edit';

export type QuickAddTransactionSheetHandle = {
  open: () => void;
  openCreate: () => void;
  openEdit: (transaction: Transaction) => void;
  close: () => void;
};

type QuickAddTransactionSheetProps = {
  categories: Category[];
};

function buildDefaultValues(categories: Category[], transaction?: Transaction | null): QuickAddTransactionValues {
  const preferredType =
    transaction?.type ?? categories.find((category) => category.type === 'expense')?.type ?? categories[0]?.type ?? 'expense';
  const preferredCategoryId =
    transaction?.categoryId ?? categories.find((category) => category.type === preferredType)?.id ?? categories[0]?.id ?? '';

  return {
    categoryId: preferredCategoryId,
    amount: transaction?.amount ?? '',
    type: preferredType,
    date: toDateInputValue(transaction?.date),
    note: transaction?.note ?? '',
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể kết nối backend lúc này.';
}

function getTransactionCopy(type: TransactionType, mode: TransactionSheetMode) {
  if (type === 'income') {
    return {
      eyebrow: mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Thêm nhanh',
      title: mode === 'edit' ? 'Cập nhật khoản thu' : 'Thêm khoản thu nhanh',
      description:
        mode === 'edit'
          ? 'Cập nhật danh mục, ngày, số tiền hoặc ghi chú của khoản thu ngay trong khung này.'
          : 'Nhập khoản thu ngay từ màn hình tổng quan để số dư và các thông tin liên quan cập nhật ngay lập tức.',
      amountPlaceholder: 'Ví dụ: 12000000',
      datePlaceholder: 'YYYY-MM-DD',
      notePlaceholder: 'Ví dụ: Lương tháng, thưởng, hoàn tiền',
      submitLabel: mode === 'edit' ? 'Cập nhật khoản thu' : 'Lưu khoản thu',
      categoryLabel: 'Danh mục thu nhập',
    };
  }

  return {
    eyebrow: mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Thêm nhanh',
    title: mode === 'edit' ? 'Cập nhật khoản chi' : 'Thêm khoản chi nhanh',
    description:
      mode === 'edit'
        ? 'Cập nhật hoặc xóa giao dịch chi ngay trong danh sách để các thông tin tổng quan tự động làm mới.'
        : 'Nhập khoản chi nhanh bằng khung kéo lên, danh mục và bảng điều khiển sẽ được làm mới ngay sau khi lưu.',
    amountPlaceholder: 'Ví dụ: 150000',
    datePlaceholder: 'YYYY-MM-DD',
    notePlaceholder: 'Ví dụ: Ăn trưa, xăng xe, mua sắm',
    submitLabel: mode === 'edit' ? 'Cập nhật khoản chi' : 'Lưu khoản chi',
    categoryLabel: 'Danh mục chi tiêu',
  };
}

function toTransactionPayload(values: QuickAddTransactionValues) {
  return {
    categoryId: values.categoryId,
    amount: values.amount.trim(),
    type: values.type,
    date: new Date(values.date).toISOString(),
    note: values.note?.trim() || undefined,
  };
}

export const QuickAddTransactionSheet = forwardRef<
  QuickAddTransactionSheetHandle,
  QuickAddTransactionSheetProps
>(function QuickAddTransactionSheet({ categories }, ref) {
  const palette = getFinancePalette(useColorScheme());
  const queryClient = useQueryClient();
  const { sessionToken } = useSession();
  const modalRef = useRef<BottomSheetModal>(null);
  const [mode, setMode] = useState<TransactionSheetMode>('create');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm<QuickAddTransactionValues>({
    resolver: zodResolver(quickAddTransactionSchema),
    defaultValues: buildDefaultValues(categories),
  });

  const selectedType = useWatch({
    control,
    name: 'type',
  });
  const selectedCategoryId = useWatch({
    control,
    name: 'categoryId',
  });
  const availableCategories = categories.filter((category) => category.type === selectedType);
  const transactionCopy = getTransactionCopy(selectedType, mode);

  useEffect(() => {
    const nextCategories = categories.filter((category) => category.type === selectedType);

    if (!nextCategories.some((category) => category.id === selectedCategoryId)) {
      setValue('categoryId', nextCategories[0]?.id ?? '', { shouldValidate: true });
    }
  }, [categories, selectedCategoryId, selectedType, setValue]);

  const invalidateFinanceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-bundle', sessionToken] }),
      queryClient.invalidateQueries({ queryKey: ['transactions', sessionToken] }),
      queryClient.invalidateQueries({ queryKey: ['budgets', sessionToken] }),
    ]);
  };

  const resetMutations = () => {
    createTransactionMutation.reset();
    updateTransactionMutation.reset();
    deleteTransactionMutation.reset();
  };

  const createTransactionMutation = useMutation({
    mutationFn: async (values: QuickAddTransactionValues) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      return financeApi.createTransaction(toTransactionPayload(values), sessionToken);
    },
    onSuccess: async () => {
      await invalidateFinanceQueries();

      modalRef.current?.dismiss();
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (values: QuickAddTransactionValues) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      if (!editingTransaction) {
        throw new Error('Không tìm thấy giao dịch cần chỉnh sửa');
      }

      return financeApi.updateTransaction(editingTransaction.id, toTransactionPayload(values), sessionToken);
    },
    onSuccess: async () => {
      await invalidateFinanceQueries();

      modalRef.current?.dismiss();
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      return financeApi.deleteTransaction(transactionId, sessionToken);
    },
    onSuccess: async () => {
      await invalidateFinanceQueries();

      modalRef.current?.dismiss();
    },
  });

  const isSubmitting =
    createTransactionMutation.isPending || updateTransactionMutation.isPending || deleteTransactionMutation.isPending;
  const activeError =
    deleteTransactionMutation.error ?? updateTransactionMutation.error ?? createTransactionMutation.error;

  function openCreate() {
    setMode('create');
    setEditingTransaction(null);
    resetMutations();
    reset(buildDefaultValues(categories));
    modalRef.current?.present();
  }

  function openEdit(transaction: Transaction) {
    setMode('edit');
    setEditingTransaction(transaction);
    resetMutations();
    reset(buildDefaultValues(categories, transaction));
    modalRef.current?.present();
  }

  function open() {
    openCreate();
  }

  function close() {
    modalRef.current?.dismiss();
  }

  useImperativeHandle(ref, () => ({ open, openCreate, openEdit, close }), [categories, reset]);

  const handleDismiss = () => {
    setMode('create');
    setEditingTransaction(null);
    resetMutations();
    reset(buildDefaultValues(categories));
  };

  const handleTransactionSubmit = handleSubmit(async (values) => {
    if (mode === 'edit') {
      await updateTransactionMutation.mutateAsync(values);
      return;
    }

    await createTransactionMutation.mutateAsync(values);
  });

  const handleDelete = () => {
    if (!editingTransaction || isSubmitting) {
      return;
    }

    Alert.alert('Xóa giao dịch?', 'Giao dịch này sẽ bị xóa khỏi danh sách và màn hình tổng quan.', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          void deleteTransactionMutation.mutateAsync(editingTransaction.id);
        },
      },
    ]);
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={quickAddSnapPoints}
      enablePanDownToClose
      onDismiss={handleDismiss}
      handleIndicatorStyle={{ backgroundColor: palette.border }}
      backgroundStyle={{ backgroundColor: palette.surface, borderRadius: 32 }}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>{transactionCopy.eyebrow}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{transactionCopy.title}</Text>
          <Text style={[styles.description, { color: palette.mutedText }]}>{transactionCopy.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Loại giao dịch</Text>
          <View style={styles.segmentedRow}>
            {(['expense', 'income'] as const).map((option) => {
              const isActive = option === selectedType;

              return (
                <Pressable
                  key={option}
                  onPress={() => setValue('type', option, { shouldDirty: true, shouldValidate: true })}
                  style={({ pressed }) => [
                    styles.segmentedButton,
                    {
                      backgroundColor: isActive ? palette.accent : palette.surfaceMuted,
                      borderColor: isActive ? palette.accent : palette.border,
                      opacity: pressed ? 0.86 : 1,
                    },
                  ]}
                >
                  <View style={styles.segmentedContent}>
                    <FontAwesome name={option === 'expense' ? 'arrow-down' : 'arrow-up'} size={14} color={isActive ? '#ffffff' : palette.text} />
                    <Text style={[styles.segmentedText, { color: isActive ? '#ffffff' : palette.text }]}>
                      {option === 'expense' ? 'Khoản chi' : 'Khoản thu'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errors.type ? <Text style={[styles.errorText, { color: palette.danger }]}>{errors.type.message}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>{transactionCopy.categoryLabel}</Text>
          {availableCategories.length > 0 ? (
            <View style={styles.categoryGrid}>
              {availableCategories.map((category) => {
                const isActive = category.id === selectedCategoryId;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setValue('categoryId', category.id, { shouldDirty: true, shouldValidate: true })}
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
                        name={getCategoryIconName(category.name, category.type)}
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
          ) : (
            <View style={[styles.inlineState, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}> 
              <Text style={[styles.inlineStateText, { color: palette.mutedText }]}>Không có danh mục nào cho loại giao dịch này.</Text>
            </View>
          )}
          {errors.categoryId ? <Text style={[styles.errorText, { color: palette.danger }]}>{errors.categoryId.message}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Số tiền</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onBlur, onChange, value } }) => (
              <BottomSheetTextInput
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="number-pad"
                placeholder={transactionCopy.amountPlaceholder}
                placeholderTextColor={palette.mutedText}
                selectionColor={palette.accent}
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: errors.amount ? palette.danger : palette.border,
                    color: palette.text,
                  },
                ]}
              />
            )}
          />
          {errors.amount ? <Text style={[styles.errorText, { color: palette.danger }]}>{errors.amount.message}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Ngày giao dịch</Text>
          <Controller
            control={control}
            name="date"
            render={({ field: { onBlur, onChange, value } }) => (
              <BottomSheetTextInput
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoCapitalize="none"
                placeholder={transactionCopy.datePlaceholder}
                placeholderTextColor={palette.mutedText}
                selectionColor={palette.accent}
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: errors.date ? palette.danger : palette.border,
                    color: palette.text,
                  },
                ]}
              />
            )}
          />
          {errors.date ? <Text style={[styles.errorText, { color: palette.danger }]}>{errors.date.message}</Text> : null}
          <Text style={[styles.helperText, { color: palette.mutedText }]}>Nhập theo định dạng YYYY-MM-DD để giữ ngày giao dịch đúng với backend.</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Ghi chú</Text>
          <Controller
            control={control}
            name="note"
            render={({ field: { onBlur, onChange, value } }) => (
              <BottomSheetTextInput
                multiline
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={transactionCopy.notePlaceholder}
                placeholderTextColor={palette.mutedText}
                selectionColor={palette.accent}
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: errors.note ? palette.danger : palette.border,
                    color: palette.text,
                  },
                ]}
              />
            )}
          />
          {errors.note ? <Text style={[styles.errorText, { color: palette.danger }]}>{errors.note.message}</Text> : null}
          <Text style={[styles.helperText, { color: palette.mutedText }]}>Sau khi lưu, tổng quan, giao dịch và ngân sách sẽ tự làm mới để phản ánh thay đổi mới.</Text>
        </View>

        {activeError ? (
          <View style={[styles.inlineState, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
            <Text style={[styles.inlineStateText, { color: palette.danger }]}>{getErrorMessage(activeError)}</Text>
          </View>
        ) : null}

        {mode === 'edit' ? (
          <Pressable
            onPress={handleDelete}
            disabled={isSubmitting || !editingTransaction}
            style={({ pressed }) => [
              styles.deleteButton,
              {
                backgroundColor: palette.danger,
                opacity: isSubmitting || !editingTransaction ? 0.65 : pressed ? 0.86 : 1,
              },
            ]}
          >
            {deleteTransactionMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.deleteButtonText}>Xóa giao dịch</Text>
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
            onPress={() => void handleTransactionSubmit()}
            disabled={isSubmitting || availableCategories.length === 0 || !sessionToken}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: palette.accent,
                opacity: isSubmitting || availableCategories.length === 0 || !sessionToken ? 0.6 : pressed ? 0.86 : 1,
              },
            ]}
          >
            {createTransactionMutation.isPending || updateTransactionMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>{transactionCopy.submitLabel}</Text>
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
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentedButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  segmentedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentedText: {
    fontSize: 14,
    fontFamily: financeFonts.bold,
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
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