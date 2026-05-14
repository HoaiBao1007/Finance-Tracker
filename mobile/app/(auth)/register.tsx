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
import { registerFormSchema, type RegisterFormValues } from '@/schemas/auth-form.schema';
import { useSession } from '@/providers/session-provider';

export default function RegisterScreen() {
  const palette = getFinancePalette(useColorScheme());
  const router = useRouter();
  const { signIn } = useSession();
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) => financeApi.register(values),
    onSuccess: async (payload) => {
      await signIn(payload.accessToken);
      router.replace('/(tabs)');
    },
  });

  return (
    <AuthEntryScreen
      alternateHref="/(auth)/login"
      alternateLabel="Đã có tài khoản? Đăng nhập"
      description="Tạo tài khoản để bắt đầu theo dõi thu chi, ngân sách và báo cáo trên cùng một giao diện đồng bộ cho điện thoại."
      eyebrow="Đăng ký"
      title="Tạo tài khoản mới"
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthFormField
              autoCapitalize="words"
              iconName="user-o"
              label="Họ tên"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nguyễn Văn A"
              textContentType="name"
              value={value}
              error={errors.fullName?.message}
            />
          )}
        />

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
              textContentType="newPassword"
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        {registerMutation.error ? (
          <Text style={[styles.feedbackText, { color: palette.danger }]}>{registerMutation.error.message}</Text>
        ) : null}

        <Text style={[styles.helperText, { color: palette.mutedText }]}>Ngay sau khi tạo tài khoản thành công, ứng dụng sẽ đăng nhập và chuyển thẳng vào khu vực quản lý tài chính.</Text>

        <Pressable
          accessibilityRole="button"
          disabled={registerMutation.isPending}
          onPress={handleSubmit((values) => registerMutation.mutate(values))}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: palette.accent,
              opacity: pressed || registerMutation.isPending ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
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