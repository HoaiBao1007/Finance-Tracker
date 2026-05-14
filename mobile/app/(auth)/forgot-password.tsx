import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthEntryScreen } from '@/components/mobile/auth-entry-screen';
import { AuthFormField } from '@/components/mobile/auth-form-field';
import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { financeFonts } from '@/lib/finance-ui';
import {
  passwordRecoveryRequestSchema,
  passwordResetSchema,
  type PasswordRecoveryRequestValues,
  type PasswordResetFormValues,
} from '@/schemas/password-recovery.schema';

export default function ForgotPasswordScreen() {
  const palette = getFinancePalette(useColorScheme());
  const router = useRouter();
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const {
    control: requestControl,
    formState: { errors: requestErrors },
    handleSubmit: handleRequestSubmit,
  } = useForm<PasswordRecoveryRequestValues>({
    resolver: zodResolver(passwordRecoveryRequestSchema),
    defaultValues: {
      email: '',
    },
  });
  const {
    control: resetControl,
    formState: { errors: resetErrors },
    handleSubmit: handleResetSubmit,
    reset: resetResetForm,
    setValue,
  } = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: (values: PasswordRecoveryRequestValues) =>
      financeApi.requestPasswordReset({
        email: values.email.trim(),
      }),
    onSuccess: (_payload, values) => {
      setValue('email', values.email.trim(), { shouldValidate: true });
      setValue('token', '', { shouldValidate: true });
      setRequestMessage('Nếu email tồn tại, một mã OTP đã được gửi tới email của bạn. Hãy kiểm tra Inbox hoặc Spam rồi nhập mã đó cùng mật khẩu mới ở biểu mẫu bên dưới.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (values: PasswordResetFormValues) =>
      financeApi.resetPassword({
        email: values.email.trim(),
        token: values.token.trim(),
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      resetResetForm({
        email: '',
        token: '',
        newPassword: '',
        confirmPassword: '',
      });
      router.replace('/(auth)/login');
    },
  });

  return (
    <AuthEntryScreen
      alternateHref="/(auth)/login"
      alternateLabel="Quay lại đăng nhập"
      description="Yêu cầu mã OTP qua email rồi cập nhật mật khẩu mới ngay trên điện thoại với đúng flow khôi phục tài khoản."
      eyebrow="Khôi phục truy cập"
      title="Đặt lại mật khẩu"
    >
      <View style={styles.stack}>
        <View style={[styles.sectionCard, { backgroundColor: palette.surfaceRaised }]}> 
          <Text style={[styles.sectionTitle, { color: palette.text }]}>1. Yêu cầu mã OTP</Text>
          <Text style={[styles.sectionDescription, { color: palette.mutedText }]}>Nhập email của tài khoản. Backend sẽ gửi mã OTP dùng một lần qua email để bạn đặt lại mật khẩu.</Text>

          <Controller
            control={requestControl}
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
                error={requestErrors.email?.message}
              />
            )}
          />

          {requestResetMutation.error ? (
            <Text style={[styles.feedbackText, { color: palette.danger }]}>{requestResetMutation.error.message}</Text>
          ) : null}

          {requestMessage ? (
            <View style={[styles.feedbackCard, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
              <Text style={[styles.feedbackText, { color: palette.text }]}>{requestMessage}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={requestResetMutation.isPending}
            onPress={handleRequestSubmit((values) => requestResetMutation.mutate(values))}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: palette.accent,
                opacity: pressed || requestResetMutation.isPending ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {requestResetMutation.isPending ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: palette.surfaceRaised }]}> 
          <Text style={[styles.sectionTitle, { color: palette.text }]}>2. Nhập OTP và mật khẩu mới</Text>
          <Text style={[styles.sectionDescription, { color: palette.mutedText }]}>Kiểm tra email thật của bạn, gồm cả Inbox và Spam, để lấy OTP rồi nhập vào đây cùng mật khẩu mới.</Text>

          <Controller
            control={resetControl}
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
                error={resetErrors.email?.message}
              />
            )}
          />

          <Controller
            control={resetControl}
            name="token"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthFormField
                autoCapitalize="none"
                autoCorrect={false}
                iconName="key"
                keyboardType="number-pad"
                label="Mã OTP"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Nhập mã OTP 6 số"
                value={value}
                error={resetErrors.token?.message}
              />
            )}
          />

          <Controller
            control={resetControl}
            name="newPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthFormField
                autoCapitalize="none"
                autoCorrect={false}
                iconName="lock"
                label="Mật khẩu mới"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Tối thiểu 8 ký tự"
                secureTextEntry
                textContentType="newPassword"
                value={value}
                error={resetErrors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={resetControl}
            name="confirmPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthFormField
                autoCapitalize="none"
                autoCorrect={false}
                iconName="lock"
                label="Xác nhận mật khẩu mới"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
                textContentType="password"
                value={value}
                error={resetErrors.confirmPassword?.message}
              />
            )}
          />

          {resetPasswordMutation.error ? (
            <Text style={[styles.feedbackText, { color: palette.danger }]}>{resetPasswordMutation.error.message}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={resetPasswordMutation.isPending}
            onPress={handleResetSubmit((values) => resetPasswordMutation.mutate(values))}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: palette.navy,
                opacity: pressed || resetPasswordMutation.isPending ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {resetPasswordMutation.isPending ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthEntryScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: financeFonts.bold,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: financeFonts.regular,
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: financeFonts.bold,
  },
});