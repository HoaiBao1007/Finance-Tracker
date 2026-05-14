import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';

type FeaturePlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextSteps: string[];
};

export function FeaturePlaceholderScreen({
  eyebrow,
  title,
  description,
  nextSteps,
}: FeaturePlaceholderScreenProps) {
  const palette = getFinancePalette(useColorScheme());

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
      <View style={styles.container}>
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>{eyebrow}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.description, { color: palette.mutedText }]}>{description}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Implementation queue</Text>
          {nextSteps.map((step) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: palette.accent }]} />
              <Text style={[styles.stepText, { color: palette.text }]}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});