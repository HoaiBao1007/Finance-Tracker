import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Href, Link } from 'expo-router';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeFonts } from '@/lib/finance-ui';

type AuthEntryScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: Href;
  alternateLabel: string;
  children: ReactNode;
};

export function AuthEntryScreen({
  alternateHref,
  alternateLabel,
  description,
  eyebrow,
  title,
  children,
}: AuthEntryScreenProps) {
  const palette = getFinancePalette(useColorScheme());
  const highlights = [
    {
      icon: 'line-chart' as const,
      label: 'Tổng quan',
      description: 'Thu chi theo thời gian thực',
    },
    {
      icon: 'pie-chart' as const,
      label: 'Ngân sách',
      description: 'Kiểm soát hạn mức từng nhóm',
    },
    {
      icon: 'shield' as const,
      label: 'Bảo mật',
      description: 'Phiên đăng nhập lưu an toàn',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.backgroundMuted }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safeArea}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: palette.navy, shadowColor: palette.shadow }]}>
            <View style={styles.heroHeader}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>Finance Tracker</Text>
              </View>
              <View style={[styles.liveChip, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                <FontAwesome name="lock" size={12} color="#ffffff" />
                <Text style={styles.liveChipText}>An toàn</Text>
              </View>
            </View>

            <Text style={[styles.eyebrow, { color: '#D9E8FF' }]}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            <View style={styles.highlightGrid}>
              {highlights.map((highlight) => (
                <View key={highlight.label} style={styles.highlightCard}>
                  <View style={styles.highlightIconWrap}>
                    <FontAwesome name={highlight.icon} size={15} color="#ffffff" />
                  </View>
                  <View style={styles.highlightTextBlock}>
                    <Text style={styles.highlightLabel}>{highlight.label}</Text>
                    <Text style={styles.highlightDescription}>{highlight.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formEyebrow, { color: palette.accent }]}>Truy cập</Text>
              <Text style={[styles.formTitle, { color: palette.text }]}>Tiếp tục trên điện thoại</Text>
              <Text style={[styles.formDescription, { color: palette.mutedText }]}>Đăng nhập hoặc tạo tài khoản để đồng bộ tổng quan, giao dịch, ngân sách và báo cáo trên cùng một giao diện.</Text>
            </View>
            {children}
          </View>

          <Link href={alternateHref} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryLink,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  shadowColor: palette.shadow,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryLinkText, { color: palette.text }]}>{alternateLabel}</Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 18,
  },
  hero: {
    borderRadius: 28,
    padding: 22,
    gap: 14,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  brandBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: financeFonts.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  liveChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: financeFonts.bold,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: financeFonts.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    color: '#ffffff',
    fontFamily: financeFonts.extrabold,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: financeFonts.regular,
  },
  highlightGrid: {
    gap: 10,
  },
  highlightCard: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  highlightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  highlightTextBlock: {
    flex: 1,
    gap: 2,
  },
  highlightLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  highlightDescription: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: financeFonts.regular,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  formHeader: {
    gap: 6,
  },
  formEyebrow: {
    fontSize: 12,
    fontFamily: financeFonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: financeFonts.extrabold,
    letterSpacing: -0.4,
  },
  formDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: financeFonts.regular,
  },
  secondaryLink: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  secondaryLinkText: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: financeFonts.bold,
  },
});