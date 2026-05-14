import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpenseDonutChart, TrendLineChart } from '@/components/mobile/finance-charts';
import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { formatMoney, formatMonthYear } from '@/lib/format';
import { financeFonts, toChartNumber } from '@/lib/finance-ui';
import { useSession } from '@/providers/session-provider';
import type { CategoryExpense, MonthlyTrendItem } from '@/types/finance';

const trendMonths = 6;

function moveMonth(month: number, year: number, offset: number) {
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));

  return {
    month: shifted.getUTCMonth() + 1,
    year: shifted.getUTCFullYear(),
  };
}

function sumExpenseAmounts(categories: CategoryExpense[]) {
  return categories.reduce((total, category) => {
    try {
      return total + BigInt(category.amount);
    } catch {
      return total;
    }
  }, 0n);
}

function getTopCategoryInsight(categories: CategoryExpense[]) {
  if (categories.length === 0) {
    return 'Kỳ này chưa có giao dịch chi tiêu để phân tích theo danh mục.';
  }

  const topCategory = categories[0];
  const totalExpense = sumExpenseAmounts(categories);

  if (totalExpense <= 0n) {
    return 'Tổng chi tiêu kỳ này đang bằng 0, chưa có danh mục nổi bật.';
  }

  try {
    const share = Number((BigInt(topCategory.amount) * 100n) / totalExpense);
    return `${topCategory.categoryName} đang chiếm ${share}% tổng chi tiêu kỳ này.`;
  } catch {
    return `${topCategory.categoryName} đang là danh mục chi tiêu lớn nhất kỳ này.`;
  }
}

function getTrendInsight(months: MonthlyTrendItem[]) {
  if (months.length === 0) {
    return 'Chưa có dữ liệu xu hướng 6 tháng để hiển thị.';
  }

  const latestMonth = months[months.length - 1];
  const latestIncome = toChartNumber(latestMonth.income);
  const latestExpense = toChartNumber(latestMonth.expense);

  if (latestIncome === 0 && latestExpense === 0) {
    return '6 tháng gần nhất chưa có giao dịch, báo cáo đang chờ dữ liệu mới.';
  }

  return latestIncome >= latestExpense
    ? `Tháng gần nhất đang giữ cân bằng dương với chênh lệch ${formatMoney(latestMonth.balance)}.`
    : `Tháng gần nhất đang âm ${formatMoney(latestMonth.balance.replace('-', ''))}, cần theo dõi sát mức chi.`;
}

export default function ReportsScreen() {
  const palette = getFinancePalette(useColorScheme());
  const { sessionToken } = useSession();
  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();
  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
  });

  const summaryQuery = useQuery({
    queryKey: ['report-summary', sessionToken, filters.month, filters.year],
    queryFn: () => financeApi.getSummary(filters, sessionToken!),
    enabled: Boolean(sessionToken),
  });

  const categoryQuery = useQuery({
    queryKey: ['report-category', sessionToken, filters.month, filters.year],
    queryFn: () => financeApi.getExpenseByCategory(filters, sessionToken!),
    enabled: Boolean(sessionToken),
  });

  const trendQuery = useQuery({
    queryKey: ['report-trend', sessionToken, filters.month, filters.year, trendMonths],
    queryFn: () => financeApi.getMonthlyTrend({ ...filters, months: trendMonths }, sessionToken!),
    enabled: Boolean(sessionToken),
  });

  const isPending = summaryQuery.isPending || categoryQuery.isPending || trendQuery.isPending;
  const activeError = summaryQuery.error ?? categoryQuery.error ?? trendQuery.error;
  const canMoveForward = filters.year < currentYear || (filters.year === currentYear && filters.month < currentMonth);

  if (!sessionToken) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <Text style={[styles.stateTitle, { color: palette.text }]}>Phiên đăng nhập đã hết hạn</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Vui lòng đăng nhập lại để tải dữ liệu báo cáo.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isPending) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <ActivityIndicator color={palette.accent} size="large" />
            <Text style={[styles.stateTitle, { color: palette.text }]}>Đang tải báo cáo</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Hệ thống đang tổng hợp số dư, phân bổ chi tiêu và xu hướng 6 tháng gần nhất.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (activeError || !summaryQuery.data || !categoryQuery.data || !trendQuery.data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <Text style={[styles.stateTitle, { color: palette.text }]}>Không tải được báo cáo</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>
              {activeError instanceof Error ? activeError.message : 'Không thể tải dữ liệu báo cáo lúc này.'}
            </Text>
            <Pressable
              onPress={() => {
                void summaryQuery.refetch();
                void categoryQuery.refetch();
                void trendQuery.refetch();
              }}
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
        </View>
      </SafeAreaView>
    );
  }

  const summary = summaryQuery.data;
  const expenseByCategory = categoryQuery.data;
  const trend = trendQuery.data;
  const topCategory = expenseByCategory.categories[0];
  const trendAverageBalance =
    trend.months.length > 0
      ? Math.round(
          trend.months.reduce((total, monthItem) => total + toChartNumber(monthItem.balance), 0) / trend.months.length,
        )
      : 0;
  const summaryCards = [
    {
      key: 'balance',
      label: 'Số dư',
      value: formatMoney(summary.balance),
      icon: 'dollar',
      backgroundColor: palette.navy,
    },
    {
      key: 'income',
      label: 'Thu vào',
      value: formatMoney(summary.totalIncome),
      icon: 'arrow-up',
      backgroundColor: palette.income,
    },
    {
      key: 'expense',
      label: 'Chi ra',
      value: formatMoney(summary.totalExpense),
      icon: 'arrow-down',
      backgroundColor: palette.expense,
    },
  ] as const;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
          <Text style={[styles.eyebrow, { color: palette.accent }]}>Báo cáo</Text>
          <Text style={[styles.title, { color: palette.text }]}>Phân tích thu chi theo kỳ</Text>
          <Text style={[styles.description, { color: palette.mutedText }]}> 
            Báo cáo đã được đồng bộ với bảng điều khiển mới để đọc nhanh trên điện thoại nhưng vẫn giữ đủ chiều sâu cho quyết định tài chính.
          </Text>

          <View style={styles.periodRow}>
            <Pressable
              onPress={() => setFilters((current) => moveMonth(current.month, current.year, -1))}
              style={({ pressed }) => [
                styles.periodButton,
                {
                  backgroundColor: palette.surfaceRaised,
                  borderColor: palette.border,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <FontAwesome name="chevron-left" size={12} color={palette.text} />
              <Text style={[styles.periodButtonText, { color: palette.text }]}>Trước</Text>
            </Pressable>

            <View style={[styles.periodBadge, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
              <Text style={[styles.periodBadgeText, { color: palette.accent }]}>{formatMonthYear(filters.month, filters.year)}</Text>
            </View>

            <Pressable
              onPress={() => setFilters((current) => moveMonth(current.month, current.year, 1))}
              disabled={!canMoveForward}
              style={({ pressed }) => [
                styles.periodButton,
                {
                  backgroundColor: palette.surfaceRaised,
                  borderColor: palette.border,
                  opacity: !canMoveForward ? 0.5 : pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={[styles.periodButtonText, { color: palette.text }]}>Sau</Text>
              <FontAwesome name="chevron-right" size={12} color={palette.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.cardStack}>
          {summaryCards.map((card) => (
            <View key={card.key} style={[styles.summaryCard, { backgroundColor: card.backgroundColor, shadowColor: palette.shadow }]}> 
              <View style={styles.summaryTop}>
                <Text style={styles.summaryLabel}>{card.label}</Text>
                <View style={styles.summaryIcon}>
                  <FontAwesome name={card.icon} size={16} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.summaryValue}>{card.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.insightRow}>
          <View style={[styles.insightCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
            <Text style={[styles.insightLabel, { color: palette.mutedText }]}>Danh mục lớn nhất</Text>
            <Text style={[styles.insightValue, { color: palette.text }]}>{topCategory?.categoryName ?? 'Chưa có dữ liệu'}</Text>
            <Text style={[styles.insightCaption, { color: palette.accent }]}> 
              {topCategory ? formatMoney(topCategory.amount) : '0 đ'}
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
            <Text style={[styles.insightLabel, { color: palette.mutedText }]}>Xu hướng trung bình</Text>
            <Text style={[styles.insightValue, { color: palette.text }]}>{trend.months.length} tháng</Text>
            <Text style={[styles.insightCaption, { color: trendAverageBalance >= 0 ? palette.income : palette.danger }]}> 
              {formatMoney(Math.abs(trendAverageBalance).toString())}
            </Text>
          </View>
        </View>

        <View style={[styles.chartPanel, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
          <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>Phân tích</Text>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Phân bổ chi tiêu</Text>
          <Text style={[styles.sectionDescription, { color: palette.mutedText }]}>{getTopCategoryInsight(expenseByCategory.categories)}</Text>
          <ExpenseDonutChart categories={expenseByCategory.categories} palette={palette} />
        </View>

        <View style={[styles.chartPanel, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
          <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>Xu hướng</Text>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Thu và chi theo thời gian</Text>
          <Text style={[styles.sectionDescription, { color: palette.mutedText }]}>{getTrendInsight(trend.months)}</Text>
          <TrendLineChart months={trend.months} palette={palette} />
        </View>
      </ScrollView>
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
  hero: {
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
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  periodButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodButtonText: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
  },
  periodBadge: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  periodBadgeText: {
    fontSize: 13,
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
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: financeFonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 32,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.8,
  },
  insightRow: {
    gap: 12,
  },
  insightCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 6,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  insightLabel: {
    fontSize: 12,
    fontFamily: financeFonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  insightValue: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: financeFonts.bold,
  },
  insightCaption: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: financeFonts.bold,
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
  sectionDescription: {
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
});