import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  QuickAddTransactionSheet,
  type QuickAddTransactionSheetHandle,
} from '@/components/mobile/quick-add-transaction-sheet';
import { ExpenseDonutChart, TrendLineChart } from '@/components/mobile/finance-charts';
import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { formatMoney, formatMonthYear, formatShortDate, formatSignedMoney } from '@/lib/format';
import { financeFonts, getCategoryIconName, getFriendlyName } from '@/lib/finance-ui';
import { useSession } from '@/providers/session-provider';
import type { Budget } from '@/types/finance';

function isBudgetAtRisk(budget: Budget) {
  try {
    const limit = BigInt(budget.limitAmount);
    const spent = BigInt(budget.spentAmount);

    if (limit <= 0n) {
      return false;
    }

    return spent * 100n >= limit * 80n;
  } catch {
    return false;
  }
}

export default function HomeScreen() {
  const palette = getFinancePalette(useColorScheme());
  const { sessionToken } = useSession();
  const quickAddSheetRef = useRef<QuickAddTransactionSheetHandle>(null);
  const now = new Date();
  const dashboardFilters = {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
    months: 6,
  };

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-bundle', sessionToken, dashboardFilters.month, dashboardFilters.year],
    queryFn: () => financeApi.getDashboardBundle(dashboardFilters, sessionToken!),
    enabled: Boolean(sessionToken),
  });

  const openQuickAdd = () => {
    quickAddSheetRef.current?.openCreate();
  };

  if (!sessionToken) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Phiên đăng nhập đã hết hạn</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Vui lòng đăng nhập lại để xem bảng điều khiển.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (dashboardQuery.isPending) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={[styles.stateTitle, { color: palette.text }]}>Đang tải tổng quan</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Hệ thống đang đồng bộ số dư, thu nhập, chi tiêu và biểu đồ tháng này.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Không tải được bảng điều khiển</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>
              {dashboardQuery.error instanceof Error ? dashboardQuery.error.message : 'Không thể kết nối dữ liệu lúc này.'}
            </Text>
            <Pressable
              onPress={() => dashboardQuery.refetch()}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  backgroundColor: palette.accentSoft,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text style={[styles.retryButtonText, { color: palette.accent }]}>Thử lại</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { currentUser, snapshot, categories } = dashboardQuery.data;
  const recentTransactions = snapshot.recentTransactions.slice(0, 3);
  const riskyBudget = snapshot.budgets.find(isBudgetAtRisk);
  const summaryCards = [
    {
      key: 'balance',
      label: 'Tổng số dư',
      value: formatMoney(snapshot.summary.balance),
      icon: 'dollar',
      backgroundColor: palette.navy,
    },
    {
      key: 'income',
      label: 'Thu nhập',
      value: formatMoney(snapshot.summary.totalIncome),
      icon: 'arrow-right',
      backgroundColor: palette.income,
    },
    {
      key: 'expense',
      label: 'Chi tiêu',
      value: formatMoney(snapshot.summary.totalExpense),
      icon: 'shopping-cart',
      backgroundColor: palette.expense,
    },
  ] as const;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeTextBlock}>
            <Text style={[styles.welcomeTitle, { color: palette.text }]}>CHÀO {getFriendlyName(currentUser.fullName)}!</Text>
            <Text style={[styles.welcomeSubtitle, { color: palette.mutedText }]}> 
              {formatMonthYear(snapshot.filters.month, snapshot.filters.year)} · Bảng điều khiển theo phong cách Modern Professional.
            </Text>
          </View>

          <View style={[styles.periodBadge, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
            <Text style={[styles.periodBadgeText, { color: palette.accent }]}>Kỳ này</Text>
          </View>
        </View>

        <View style={styles.cardStack}>
          {summaryCards.map((card) => (
            <View key={card.key} style={[styles.summaryCard, { backgroundColor: card.backgroundColor, shadowColor: palette.shadow }]}> 
              <View style={styles.summaryCardTop}>
                <Text style={styles.summaryCardLabel}>{card.label}</Text>
                <View style={styles.summaryCardIcon}>
                  <FontAwesome name={card.icon} size={18} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.summaryCardValue}>{card.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartPanel, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>Trực quan</Text>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Xu hướng thu chi</Text>
            </View>
            <View style={[styles.sectionChip, { backgroundColor: palette.surfaceMuted }]}> 
              <Text style={[styles.sectionChipText, { color: palette.mutedText }]}>6 tháng</Text>
            </View>
          </View>
          <TrendLineChart months={snapshot.monthlyTrend.months} palette={palette} />
        </View>

        <View style={[styles.chartPanel, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>Phân tích</Text>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Phân bổ chi tiêu</Text>
            </View>
          </View>
          <ExpenseDonutChart categories={snapshot.expenseByCategory.categories} palette={palette} />
        </View>

        {riskyBudget ? (
          <View style={[styles.alertCard, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}> 
            <View style={[styles.alertIcon, { backgroundColor: palette.accentSoft }]}> 
              <FontAwesome name="warning" size={16} color={palette.warning} />
            </View>
            <View style={styles.alertBody}>
              <Text style={[styles.alertTitle, { color: palette.text }]}>Ngân sách cần chú ý</Text>
              <Text style={[styles.alertText, { color: palette.mutedText }]}> 
                {riskyBudget.category.name} đang dùng {formatMoney(riskyBudget.spentAmount)} trên mức {formatMoney(riskyBudget.limitAmount)}.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.recentPanel, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>Gần đây</Text>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Giao dịch gần đây</Text>
            </View>
          </View>

          {recentTransactions.length > 0 ? (
            <View style={styles.recentList}>
              {recentTransactions.map((transaction, index) => (
                <View
                  key={transaction.id}
                  style={[
                    styles.transactionRow,
                    index < recentTransactions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: palette.border,
                    },
                  ]}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: palette.surfaceMuted }]}>
                    <FontAwesome
                      name={getCategoryIconName(transaction.category.name, transaction.type)}
                      size={16}
                      color={transaction.type === 'income' ? palette.income : palette.navy}
                    />
                  </View>

                  <View style={styles.transactionBody}>
                    <Text style={[styles.transactionTitle, { color: palette.text }]}>{transaction.category.name}</Text>
                    <Text style={[styles.transactionMeta, { color: palette.mutedText }]}>
                      {transaction.note || formatShortDate(transaction.date)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'income' ? palette.income : palette.danger },
                    ]}
                  >
                    {formatSignedMoney(transaction.amount, transaction.type)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyListText, { color: palette.mutedText }]}>Chưa có giao dịch gần đây cho kỳ hiện tại.</Text>
          )}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thêm giao dịch nhanh"
        onPress={openQuickAdd}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: palette.accent,
            shadowColor: palette.shadow,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      <QuickAddTransactionSheet ref={quickAddSheetRef} categories={categories} />
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
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
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
    fontFamily: financeFonts.extrabold,
    lineHeight: 30,
  },
  stateText: {
    fontSize: 14,
    fontFamily: financeFonts.regular,
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  welcomeTextBlock: {
    flex: 1,
    gap: 6,
  },
  welcomeTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: financeFonts.regular,
  },
  periodBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  periodBadgeText: {
    fontSize: 12,
    fontFamily: financeFonts.bold,
  },
  cardStack: {
    gap: 12,
  },
  summaryCard: {
    borderRadius: 28,
    padding: 18,
    gap: 14,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  summaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryCardLabel: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: financeFonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValue: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 32,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.8,
  },
  chartPanel: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  sectionEyebrow: {
    fontSize: 12,
    fontFamily: financeFonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.6,
  },
  sectionChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sectionChipText: {
    fontSize: 11,
    fontFamily: financeFonts.bold,
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    flexDirection: 'row',
  },
  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: financeFonts.bold,
  },
  alertText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: financeFonts.regular,
  },
  recentPanel: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 10,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  recentList: {
    gap: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
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
  transactionAmount: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: financeFonts.bold,
  },
  emptyListText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: financeFonts.regular,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 112,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
});