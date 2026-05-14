import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  QuickAddTransactionSheet,
  type QuickAddTransactionSheetHandle,
} from '@/components/mobile/quick-add-transaction-sheet';
import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { formatMoney, formatMonthYear, formatShortDate, formatSignedMoney } from '@/lib/format';
import { financeFonts, getCategoryIconName } from '@/lib/finance-ui';
import { useSession } from '@/providers/session-provider';
import type { Transaction, TransactionType } from '@/types/finance';

type TransactionFilter = 'all' | TransactionType;

const filterOptions: Array<{ key: TransactionFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'income', label: 'Thu nhập' },
];

function toAmountBigInt(amount: string) {
  try {
    return BigInt(amount);
  } catch {
    return 0n;
  }
}

function formatNetAmount(amount: bigint) {
  const absoluteAmount = amount < 0n ? -amount : amount;
  return `${amount < 0n ? '-' : '+'}${formatMoney(absoluteAmount.toString())}`;
}

export default function TransactionsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<TransactionFilter>('all');
  const palette = getFinancePalette(useColorScheme());
  const { sessionToken } = useSession();
  const transactionSheetRef = useRef<QuickAddTransactionSheetHandle>(null);
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const transactionsQuery = useQuery({
    queryKey: ['transactions', sessionToken, month, year, selectedFilter],
    queryFn: () =>
      financeApi.getTransactions(
        {
          month,
          year,
          page: 1,
          limit: 25,
          type: selectedFilter === 'all' ? undefined : selectedFilter,
        },
        sessionToken!,
      ),
    enabled: Boolean(sessionToken),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', sessionToken],
    queryFn: () => financeApi.getCategories(undefined, sessionToken!),
    enabled: Boolean(sessionToken),
  });

  const openCreateTransaction = () => {
    if (!categoriesQuery.data) {
      return;
    }

    transactionSheetRef.current?.openCreate();
  };

  const openEditTransaction = (transaction: Transaction) => {
    if (!categoriesQuery.data) {
      return;
    }

    transactionSheetRef.current?.openEdit(transaction);
  };

  const totals = (transactionsQuery.data ?? []).reduce(
    (accumulator, transaction) => {
      const amount = toAmountBigInt(transaction.amount);

      if (transaction.type === 'income') {
        return {
          ...accumulator,
          income: accumulator.income + amount,
        };
      }

      return {
        ...accumulator,
        expense: accumulator.expense + amount,
      };
    },
    {
      income: 0n,
      expense: 0n,
    },
  );
  const netFlow = totals.income - totals.expense;

  if (!sessionToken) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.content}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Phiên đăng nhập đã hết hạn</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Vui lòng đăng nhập lại để tải danh sách giao dịch.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextBlock}>
              <Text style={[styles.eyebrow, { color: palette.accent }]}>Giao dịch</Text>
              <Text style={[styles.title, { color: palette.text }]}>Dòng tiền tháng này</Text>
              <Text style={[styles.description, { color: palette.mutedText }]}> 
                {formatMonthYear(month, year)} · Lọc theo loại giao dịch để xem nhanh dòng tiền vào và ra trong kỳ hiện tại.
              </Text>
            </View>

            <Pressable
              onPress={openCreateTransaction}
              disabled={!categoriesQuery.data}
              style={({ pressed }) => [
                styles.primaryPill,
                {
                  backgroundColor: palette.accent,
                  opacity: !categoriesQuery.data ? 0.6 : pressed ? 0.88 : 1,
                },
              ]}
            >
              <FontAwesome name="plus" size={14} color="#ffffff" />
              <Text style={styles.primaryPillText}>Thêm mới</Text>
            </Pressable>
          </View>

          <View style={styles.metricRow}>
            <View style={[styles.metricCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.metricLabel, { color: palette.mutedText }]}>Tổng vào</Text>
              <Text style={[styles.metricValue, { color: palette.income }]}>{formatMoney(totals.income.toString())}</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.metricLabel, { color: palette.mutedText }]}>Tổng ra</Text>
              <Text style={[styles.metricValue, { color: palette.expense }]}>{formatMoney(totals.expense.toString())}</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.metricLabel, { color: palette.mutedText }]}>Dòng tiền</Text>
              <Text style={[styles.metricValue, { color: netFlow >= 0n ? palette.income : palette.danger }]}>
                {formatNetAmount(netFlow)}
              </Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {filterOptions.map((option) => {
              const isActive = option.key === selectedFilter;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedFilter(option.key)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? palette.accentSoft : palette.surfaceMuted,
                      borderColor: isActive ? palette.accent : palette.border,
                      opacity: pressed ? 0.86 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: isActive ? palette.accent : palette.text }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.helperText, { color: categoriesQuery.isError ? palette.danger : palette.mutedText }]}> 
            {categoriesQuery.isPending
              ? 'Đang tải danh mục để mở form tạo và chỉnh sửa giao dịch.'
              : categoriesQuery.isError
                ? 'Không tải được danh mục, tạm thời chưa thể mở khung giao dịch.'
                : 'Chạm vào từng giao dịch để cập nhật hoặc xóa ngay trong khung chỉnh sửa.'}
          </Text>
        </View>

        {transactionsQuery.isPending ? (
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <ActivityIndicator color={palette.accent} size="large" />
            <Text style={[styles.stateTitle, { color: palette.text }]}>Đang tải giao dịch</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Danh sách giao dịch đang được đồng bộ từ máy chủ.</Text>
          </View>
        ) : transactionsQuery.isError ? (
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Không tải được giao dịch</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>
              {transactionsQuery.error instanceof Error ? transactionsQuery.error.message : 'Không thể tải danh sách giao dịch lúc này.'}
            </Text>
            <Pressable
              onPress={() => transactionsQuery.refetch()}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: palette.accentSoft,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>Thử tải lại</Text>
            </Pressable>
          </View>
        ) : transactionsQuery.data.length === 0 ? (
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Chưa có giao dịch</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Bộ lọc hiện tại chưa có giao dịch nào. Bạn có thể đổi bộ lọc hoặc thêm giao dịch mới.</Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>{transactionsQuery.data.length} giao dịch</Text>
              <Text style={[styles.sectionSubtitle, { color: palette.mutedText }]}>Nhấn để chỉnh sửa trực tiếp</Text>
            </View>

            <View style={styles.cards}>
              {transactionsQuery.data.map((transaction) => {
                const isIncome = transaction.type === 'income';
                const toneColor = isIncome ? palette.income : palette.expense;

                return (
                  <Pressable
                    key={transaction.id}
                    disabled={!categoriesQuery.data}
                    onPress={() => openEditTransaction(transaction)}
                    style={({ pressed }) => [
                      styles.transactionCard,
                      {
                        backgroundColor: pressed && categoriesQuery.data ? palette.surfaceMuted : palette.surface,
                        borderColor: palette.border,
                        shadowColor: palette.shadow,
                        opacity: !categoriesQuery.data ? 0.72 : 1,
                      },
                    ]}
                  >
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, { backgroundColor: `${toneColor}1A` }]}> 
                        <FontAwesome name={getCategoryIconName(transaction.category.name, transaction.type)} size={16} color={toneColor} />
                      </View>

                      <View style={styles.transactionBody}>
                        <Text style={[styles.transactionTitle, { color: palette.text }]}>{transaction.category.name}</Text>
                        <Text style={[styles.transactionMeta, { color: palette.mutedText }]}> 
                          {transaction.note || formatShortDate(transaction.date)} · {formatShortDate(transaction.date)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transactionRight}>
                      <Text style={[styles.transactionAmount, { color: isIncome ? palette.income : palette.danger }]}>
                        {formatSignedMoney(transaction.amount, transaction.type)}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: `${toneColor}1A` }]}> 
                        <Text style={[styles.typeBadgeText, { color: toneColor }]}>{isIncome ? 'Thu' : 'Chi'}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <QuickAddTransactionSheet ref={transactionSheetRef} categories={categoriesQuery.data ?? []} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 126,
    gap: 16,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroTextBlock: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: financeFonts.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.7,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: financeFonts.regular,
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  primaryPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: financeFonts.bold,
  },
  metricRow: {
    gap: 10,
  },
  metricCard: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: financeFonts.medium,
  },
  metricValue: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.4,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: financeFonts.regular,
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 12,
    alignItems: 'flex-start',
  },
  stateTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: financeFonts.extrabold,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: financeFonts.regular,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  listSection: {
    gap: 12,
  },
  listHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.6,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.regular,
  },
  cards: {
    gap: 12,
  },
  transactionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionBody: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: financeFonts.bold,
  },
  transactionMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.regular,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: financeFonts.bold,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: financeFonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
