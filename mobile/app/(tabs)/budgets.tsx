import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetSheet, type BudgetSheetHandle } from '@/components/mobile/budget-sheet';
import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { formatMoney, formatMonthYear } from '@/lib/format';
import { financeFonts, getCategoryIconName } from '@/lib/finance-ui';
import { useSession } from '@/providers/session-provider';
import type { Budget } from '@/types/finance';

function toAmountBigInt(amount: string) {
  try {
    return BigInt(amount);
  } catch {
    return 0n;
  }
}

function getSpentPercent(budget: Budget) {
  try {
    const limit = BigInt(budget.limitAmount);
    const spent = BigInt(budget.spentAmount);

    if (limit <= 0n) {
      return 0;
    }

    const percent = Number((spent * 100n) / limit);
    return Math.max(0, Math.min(percent, 100));
  } catch {
    return 0;
  }
}

function getBudgetTone(budget: Budget) {
  try {
    const remaining = BigInt(budget.remainingAmount);
    const limit = BigInt(budget.limitAmount);
    const spent = BigInt(budget.spentAmount);

    if (remaining < 0n) {
      return 'danger' as const;
    }

    if (limit > 0n && spent * 100n >= limit * 80n) {
      return 'warning' as const;
    }

    return 'success' as const;
  } catch {
    return 'success' as const;
  }
}

export default function BudgetsScreen() {
  const palette = getFinancePalette(useColorScheme());
  const { sessionToken } = useSession();
  const budgetSheetRef = useRef<BudgetSheetHandle>(null);
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const budgetsQuery = useQuery({
    queryKey: ['budgets', sessionToken, month, year],
    queryFn: () => financeApi.getBudgets({ month, year }, sessionToken!),
    enabled: Boolean(sessionToken),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', sessionToken, 'expense'],
    queryFn: () => financeApi.getCategories({ type: 'expense' }, sessionToken!),
    enabled: Boolean(sessionToken),
  });

  const sortedBudgets = [...(budgetsQuery.data ?? [])].sort((left, right) => {
    const toneRank = { danger: 0, warning: 1, success: 2 };
    const toneDelta = toneRank[getBudgetTone(left)] - toneRank[getBudgetTone(right)];

    if (toneDelta !== 0) {
      return toneDelta;
    }

    return getSpentPercent(right) - getSpentPercent(left);
  });

  const budgetTotals = sortedBudgets.reduce(
    (accumulator, budget) => ({
      limit: accumulator.limit + toAmountBigInt(budget.limitAmount),
      spent: accumulator.spent + toAmountBigInt(budget.spentAmount),
      warningCount: accumulator.warningCount + (getBudgetTone(budget) === 'warning' ? 1 : 0),
      dangerCount: accumulator.dangerCount + (getBudgetTone(budget) === 'danger' ? 1 : 0),
    }),
    {
      limit: 0n,
      spent: 0n,
      warningCount: 0,
      dangerCount: 0,
    },
  );

  const openCreateBudget = () => {
    if (!categoriesQuery.data) {
      return;
    }

    budgetSheetRef.current?.openCreate();
  };

  const openEditBudget = (budget: Budget) => {
    if (!categoriesQuery.data) {
      return;
    }

    budgetSheetRef.current?.openEdit(budget);
  };

  if (!sessionToken) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.content}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Phiên đăng nhập đã hết hạn</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Vui lòng đăng nhập lại để tải danh sách ngân sách.</Text>
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
              <Text style={[styles.eyebrow, { color: palette.accent }]}>Ngân sách</Text>
              <Text style={[styles.title, { color: palette.text }]}>Kế hoạch chi tiêu</Text>
              <Text style={[styles.description, { color: palette.mutedText }]}> 
                {formatMonthYear(month, year)} · Những mục cảnh báo hoặc vượt ngân sách được ưu tiên lên đầu để bạn xử lý nhanh.
              </Text>
            </View>

            <Pressable
              onPress={openCreateBudget}
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
              <Text style={styles.primaryPillText}>Tạo mới</Text>
            </Pressable>
          </View>

          <View style={styles.metricRow}>
            <View style={[styles.metricCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.metricLabel, { color: palette.mutedText }]}>Hạn mức</Text>
              <Text style={[styles.metricValue, { color: palette.text }]}>{formatMoney(budgetTotals.limit.toString())}</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.metricLabel, { color: palette.mutedText }]}>Cảnh báo</Text>
              <Text style={[styles.metricValue, { color: palette.warning }]}>{budgetTotals.warningCount}</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.metricLabel, { color: palette.mutedText }]}>Vượt mức</Text>
              <Text style={[styles.metricValue, { color: palette.danger }]}>{budgetTotals.dangerCount}</Text>
            </View>
          </View>

          <Text style={[styles.helperText, { color: categoriesQuery.isError ? palette.danger : palette.mutedText }]}> 
            {categoriesQuery.isPending
              ? 'Đang tải danh mục chi tiêu để mở khung tạo và chỉnh sửa ngân sách.'
              : categoriesQuery.isError
                ? 'Không tải được danh mục, tạm thời chưa thể mở form ngân sách.'
                : 'Chạm vào từng thẻ ngân sách để cập nhật nhanh hạn mức hoặc xóa mục không còn dùng.'}
          </Text>
        </View>

        {budgetsQuery.isPending ? (
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <ActivityIndicator color={palette.accent} size="large" />
            <Text style={[styles.stateTitle, { color: palette.text }]}>Đang tải ngân sách</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Danh sách ngân sách đang được đồng bộ từ máy chủ.</Text>
          </View>
        ) : budgetsQuery.isError ? (
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Không tải được ngân sách</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>
              {budgetsQuery.error instanceof Error ? budgetsQuery.error.message : 'Không thể tải danh sách ngân sách lúc này.'}
            </Text>
            <Pressable
              onPress={() => budgetsQuery.refetch()}
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
        ) : sortedBudgets.length === 0 ? (
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Chưa có ngân sách</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Kỳ này chưa có hạn mức nào. Bạn có thể tạo ngân sách mới ngay trong tab này.</Text>
            <Pressable
              onPress={openCreateBudget}
              disabled={!categoriesQuery.data}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: palette.accentSoft,
                  opacity: !categoriesQuery.data ? 0.6 : pressed ? 0.86 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>Tạo ngân sách</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>{sortedBudgets.length} mục ngân sách</Text>
              <Text style={[styles.sectionSubtitle, { color: palette.mutedText }]}>
                Đã chi {formatMoney(budgetTotals.spent.toString())} trên tổng hạn mức {formatMoney(budgetTotals.limit.toString())}
              </Text>
            </View>

            <View style={styles.cards}>
              {sortedBudgets.map((budget) => {
                const tone = getBudgetTone(budget);
                const progress = getSpentPercent(budget);
                const toneColor =
                  tone === 'danger' ? palette.danger : tone === 'warning' ? palette.warning : palette.income;
                const remainingAmount = toAmountBigInt(budget.remainingAmount);

                return (
                  <Pressable
                    key={budget.id}
                    disabled={!categoriesQuery.data}
                    onPress={() => openEditBudget(budget)}
                    style={({ pressed }) => [
                      styles.budgetCard,
                      {
                        backgroundColor: pressed && categoriesQuery.data ? palette.surfaceMuted : palette.surface,
                        borderColor: palette.border,
                        shadowColor: palette.shadow,
                        opacity: !categoriesQuery.data ? 0.72 : 1,
                      },
                    ]}
                  >
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetHeaderLeft}>
                        <View style={[styles.budgetIcon, { backgroundColor: `${toneColor}1A` }]}> 
                          <FontAwesome name={getCategoryIconName(budget.category.name, 'expense')} size={16} color={toneColor} />
                        </View>

                        <View style={styles.budgetTextBlock}>
                          <Text style={[styles.budgetTitle, { color: palette.text }]}>{budget.category.name}</Text>
                          <Text style={[styles.budgetSubtitle, { color: palette.mutedText }]}> 
                            Đã chi {formatMoney(budget.spentAmount)} trên mức {formatMoney(budget.limitAmount)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: `${toneColor}1A` }]}> 
                        <Text style={[styles.statusBadgeText, { color: toneColor }]}>
                          {tone === 'danger' ? 'Vượt mức' : tone === 'warning' ? 'Cảnh báo' : 'Ổn định'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.progressTrack, { backgroundColor: palette.surfaceRaised }]}> 
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: toneColor,
                            width: `${progress}%`,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.budgetFooter}>
                      <Text style={[styles.footerText, { color: palette.mutedText }]}>Đã dùng {progress}%</Text>
                      <Text style={[styles.footerText, { color: remainingAmount < 0n ? palette.danger : toneColor }]}>
                        {remainingAmount < 0n ? 'Vượt ' : 'Còn '} 
                        {formatMoney((remainingAmount < 0n ? -remainingAmount : remainingAmount).toString())}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <BudgetSheet ref={budgetSheetRef} categories={categoriesQuery.data ?? []} month={month} year={year} />
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
  budgetCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  budgetHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  budgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetTextBlock: {
    flex: 1,
    gap: 4,
  },
  budgetTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: financeFonts.bold,
  },
  budgetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.regular,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: financeFonts.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
});
