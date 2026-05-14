import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { financeApi } from '@/lib/api';
import { AuthEntryScreen } from '@/components/mobile/auth-entry-screen';
import { AuthFormField } from '@/components/mobile/auth-form-field';
import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeFonts } from '@/lib/finance-ui';
import { loginFormSchema, type LoginFormValues } from '@/schemas/auth-form.schema';
import { useSession } from '@/providers/session-provider';

export default function LoginScreen() {
  const palette = getFinancePalette(useColorScheme());
  const router = useRouter();
  const { signIn } = useSession();
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => financeApi.login(values),
    onSuccess: async (payload) => {
      await signIn(payload.accessToken);
      router.replace('/(tabs)');
    },
  });

  return (
    <AuthEntryScreen
      alternateHref="/(auth)/register"
      alternateLabel="Chưa có tài khoản? Đăng ký ngay"
      description="Đăng nhập để xem tổng quan, giao dịch, ngân sách và báo cáo với cùng hệ giao diện mới trên điện thoại."
      eyebrow="Đăng nhập"
      title="Trở lại với tài khoản của bạn"
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthFormField
              autoCapitalize="none"
              autoCorrect={false}
              iconName="envelope-o"
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="ban@example.com"
              textContentType="emailAddress"
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthFormField
              autoCapitalize="none"
              autoCorrect={false}
              iconName="lock"
              label="Mật khẩu"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Tối thiểu 8 ký tự"
              secureTextEntry
              textContentType="password"
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        {loginMutation.error ? (
          <Text style={[styles.feedbackText, { color: palette.danger }]}>{loginMutation.error.message}</Text>
        ) : null}

        <Text style={[styles.helperText, { color: palette.mutedText }]}>Phiên đăng nhập sẽ được lưu an toàn trên thiết bị để bạn tiếp tục công việc nhanh hơn ở lần sau.</Text>

        <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={({ pressed }) => [styles.inlineLink, { opacity: pressed ? 0.82 : 1 }]}>
          <Text style={[styles.inlineLinkText, { color: palette.accent }]}>Quên mật khẩu?</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={loginMutation.isPending}
          onPress={handleSubmit((values) => loginMutation.mutate(values))}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: palette.accent,
              opacity: pressed || loginMutation.isPending ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Text>
        </Pressable>
      </View>
    </AuthEntryScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: financeFonts.regular,
  },
  inlineLink: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  inlineLinkText: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
  },
  primaryButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: financeFonts.bold,
  },
});