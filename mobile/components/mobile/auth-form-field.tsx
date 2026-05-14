import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import type { FinanceIconName } from '@/lib/finance-ui';
import { financeFonts } from '@/lib/finance-ui';

type AuthFormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  iconName?: FinanceIconName;
};

export function AuthFormField({ error, iconName, label, style, ...props }: AuthFormFieldProps) {
  const palette = getFinancePalette(useColorScheme());

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: error ? palette.danger : palette.border,
          },
        ]}
      >
        {iconName ? (
          <View style={[styles.iconWrap, { backgroundColor: palette.accentSoft }]}>
            <FontAwesome name={iconName} size={14} color={palette.accent} />
          </View>
        ) : null}
        <TextInput
          {...props}
          cursorColor={palette.accent}
          placeholderTextColor={palette.mutedText}
          selectionColor={palette.accent}
          showSoftInputOnFocus={props.showSoftInputOnFocus ?? true}
          style={[
            styles.input,
            {
              color: palette.text,
            },
            style,
          ]}
        />
      </View>
      {error ? <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: financeFonts.medium,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
});