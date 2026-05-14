import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { FinancePalette } from '@/constants/finance-theme';
import { formatMoney } from '@/lib/format';
import { financeFonts, getCategoryIconName, toChartNumber } from '@/lib/finance-ui';
import type { CategoryExpense, MonthlyTrendItem } from '@/types/finance';

const chartColors = ['#2F80ED', '#1F3A6D', '#22C55E', '#F48B8B', '#7C5CFA'];

function buildLinePath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return '';
  }

  const maxValue = Math.max(1, ...values);
  const stepX = values.length === 1 ? width : width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function formatCompactMoney(amount: string) {
  try {
    const value = BigInt(amount.replace(/^[-+]/, ''));

    if (value >= 1_000_000n) {
      return `${Number(value / 1_000_000n)}M`;
    }

    if (value >= 1_000n) {
      return `${Number(value / 1_000n)}K`;
    }

    return value.toString();
  } catch {
    return amount;
  }
}

type TrendLineChartProps = {
  months: MonthlyTrendItem[];
  palette: FinancePalette;
};

export function TrendLineChart({ months, palette }: TrendLineChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(Math.max(width - 96, 248), 360);
  const plotWidth = chartWidth - 24;
  const plotHeight = 120;

  const incomeValues = months.map((month) => toChartNumber(month.income));
  const expenseValues = months.map((month) => toChartNumber(month.expense));
  const maxValue = Math.max(1, ...incomeValues, ...expenseValues);

  const incomePath = useMemo(
    () => buildLinePath(incomeValues.map((value) => (value / maxValue) * 100), plotWidth, plotHeight),
    [incomeValues, maxValue, plotWidth],
  );
  const expensePath = useMemo(
    () => buildLinePath(expenseValues.map((value) => (value / maxValue) * 100), plotWidth, plotHeight),
    [expenseValues, maxValue, plotWidth],
  );

  return (
    <View style={styles.chartCard}>
      <View style={styles.legendRow}>
        <View style={styles.legendGroup}>
          <View style={[styles.legendDot, { backgroundColor: palette.accent }]} />
          <Text style={[styles.legendText, { color: palette.mutedText }]}>Thu nhập</Text>
        </View>
        <View style={styles.legendGroup}>
          <View style={[styles.legendDot, { backgroundColor: palette.expense }]} />
          <Text style={[styles.legendText, { color: palette.mutedText }]}>Chi tiêu</Text>
        </View>
      </View>

      <Svg width={chartWidth} height={168}>
        {[0, 1, 2, 3].map((index) => {
          const y = 20 + index * 32;
          return <Line key={index} x1="12" y1={y} x2={chartWidth - 12} y2={y} stroke={palette.chartGrid} strokeDasharray="4 6" />;
        })}

        <Path d={incomePath} stroke={palette.accent} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" transform="translate(12 20)" />
        <Path d={expensePath} stroke={palette.expense} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" transform="translate(12 20)" />

        {incomeValues.map((value, index) => {
          const stepX = incomeValues.length === 1 ? plotWidth : plotWidth / (incomeValues.length - 1);
          const x = 12 + index * stepX;
          const y = 20 + plotHeight - ((value / maxValue) * 100 * plotHeight) / 100;

          return <Circle key={`income-${months[index]?.key ?? index}`} cx={x} cy={y} r="4.5" fill={palette.accent} />;
        })}

        {expenseValues.map((value, index) => {
          const stepX = expenseValues.length === 1 ? plotWidth : plotWidth / (expenseValues.length - 1);
          const x = 12 + index * stepX;
          const y = 20 + plotHeight - ((value / maxValue) * 100 * plotHeight) / 100;

          return <Circle key={`expense-${months[index]?.key ?? index}`} cx={x} cy={y} r="4.5" fill={palette.expense} />;
        })}
      </Svg>

      <View style={styles.axisRow}>
        {months.map((month) => (
          <Text key={month.key} style={[styles.axisLabel, { color: palette.mutedText }]}>
            {month.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

type ExpenseDonutChartProps = {
  categories: CategoryExpense[];
  palette: FinancePalette;
};

export function ExpenseDonutChart({ categories, palette }: ExpenseDonutChartProps) {
  const visibleCategories = categories.slice(0, 4);
  const { totalExpense, segments } = useMemo(() => {
    const total = visibleCategories.reduce((sum, category) => sum + toChartNumber(category.amount), 0);
    let cumulative = 0;

    const nextSegments = visibleCategories.map((category, index) => {
      const amount = toChartNumber(category.amount);
      const ratio = total > 0 ? amount / total : 0;
      const currentOffset = cumulative;
      cumulative += ratio;

      return {
        ...category,
        ratio,
        offset: currentOffset,
        color: chartColors[index % chartColors.length],
      };
    });

    return {
      totalExpense: total,
      segments: nextSegments,
    };
  }, [visibleCategories]);

  const size = 132;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.donutSection}>
      <View style={styles.donutWrap}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.surfaceMuted} strokeWidth={strokeWidth} fill="none" />

          {segments.map((segment) => (
            <Circle
              key={segment.categoryId}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${segment.ratio * circumference} ${circumference}`}
              strokeDashoffset={-segment.offset * circumference}
              strokeLinecap="round"
              rotation={-90}
              originX={size / 2}
              originY={size / 2}
            />
          ))}
        </Svg>

        <View style={styles.donutCenter}>
          <Text style={[styles.donutCenterLabel, { color: palette.mutedText }]}>Tổng chi</Text>
          <Text style={[styles.donutCenterValue, { color: palette.text }]}>{formatCompactMoney(totalExpense.toString())}</Text>
        </View>
      </View>

      <View style={styles.donutLegend}>
        {segments.length > 0 ? (
          segments.map((segment) => (
            <View key={segment.categoryId} style={styles.donutLegendRow}>
              <View style={styles.donutLegendMeta}>
                <View style={[styles.donutLegendIcon, { backgroundColor: `${segment.color}20` }]}>
                  <FontAwesome name={getCategoryIconName(segment.categoryName, 'expense')} size={14} color={segment.color} />
                </View>
                <View style={styles.donutLegendTextBlock}>
                  <Text style={[styles.donutLegendTitle, { color: palette.text }]}>{segment.categoryName}</Text>
                  <Text style={[styles.donutLegendSubtitle, { color: palette.mutedText }]}>{Math.round(segment.ratio * 100)}% chi tiêu</Text>
                </View>
              </View>
              <Text style={[styles.donutLegendValue, { color: palette.text }]}>{formatMoney(segment.amount)}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: palette.mutedText }]}>Chưa có dữ liệu chi tiêu cho kỳ này.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  legendGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    fontFamily: financeFonts.medium,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  axisLabel: {
    fontSize: 11,
    fontFamily: financeFonts.medium,
  },
  donutSection: {
    gap: 18,
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  donutCenterLabel: {
    fontSize: 11,
    fontFamily: financeFonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  donutCenterValue: {
    fontSize: 20,
    fontFamily: financeFonts.extrabold,
  },
  donutLegend: {
    gap: 12,
  },
  donutLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  donutLegendMeta: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  donutLegendIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLegendTextBlock: {
    flex: 1,
    gap: 2,
  },
  donutLegendTitle: {
    fontSize: 14,
    fontFamily: financeFonts.semibold,
  },
  donutLegendSubtitle: {
    fontSize: 12,
    fontFamily: financeFonts.medium,
  },
  donutLegendValue: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: financeFonts.medium,
    lineHeight: 18,
  },
});