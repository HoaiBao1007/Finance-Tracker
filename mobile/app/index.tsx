import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { useSession } from '@/providers/session-provider';

export default function IndexScreen() {
  const palette = getFinancePalette(useColorScheme());
  const { isLoading, sessionToken } = useSession();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  return <Redirect href={sessionToken ? '/(tabs)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});