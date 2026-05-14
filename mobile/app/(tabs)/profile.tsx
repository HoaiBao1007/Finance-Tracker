import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeApi } from '@/lib/api';
import { env } from '@/lib/env';
import { financeFonts } from '@/lib/finance-ui';
import { useSession } from '@/providers/session-provider';
import {
  changePasswordSchema,
  profileUpdateSchema,
  type ChangePasswordFormValues,
  type ProfileUpdateFormValues,
} from '@/schemas/profile-form.schema';

function getInitials(fullName?: string) {
  const trimmed = fullName?.trim();

  if (!trimmed) {
    return 'FT';
  }

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể kết nối backend lúc này.';
}

const profileDefaultValues: ProfileUpdateFormValues = {
  fullName: '',
  avatarUrl: null,
};

const passwordDefaultValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const avatarSizeLimit = 1_800_000;

export default function ProfileScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const palette = getFinancePalette(useColorScheme());
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sessionToken, signOut } = useSession();
  const profileQuery = useQuery({
    queryKey: ['current-user', sessionToken],
    queryFn: () => financeApi.getCurrentUser(sessionToken!),
    enabled: Boolean(sessionToken),
  });
  const {
    control: profileControl,
    formState: { errors: profileErrors },
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    setValue: setProfileValue,
    watch: watchProfile,
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: profileDefaultValues,
  });
  const {
    control: passwordControl,
    formState: { errors: passwordErrors },
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: passwordDefaultValues,
  });
  const avatarDraft = watchProfile('avatarUrl');

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    resetProfileForm({
      fullName: profileQuery.data.fullName ?? '',
      avatarUrl: profileQuery.data.avatarUrl ?? null,
    });
  }, [profileQuery.data, resetProfileForm]);

  const invalidateUserData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['current-user', sessionToken] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-bundle', sessionToken] }),
    ]);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileUpdateFormValues) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      return financeApi.updateProfile(
        {
          fullName: values.fullName.trim(),
          avatarUrl: values.avatarUrl ?? null,
        },
        sessionToken,
      );
    },
    onSuccess: async (user) => {
      await invalidateUserData();
      setProfileNotice('Thông tin hồ sơ đã được cập nhật.');
      resetProfileForm({
        fullName: user.fullName,
        avatarUrl: user.avatarUrl ?? null,
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) => {
      if (!sessionToken) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      return financeApi.changePassword(
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        sessionToken,
      );
    },
    onSuccess: () => {
      setPasswordNotice('Mật khẩu đã được thay đổi thành công.');
      resetPasswordForm(passwordDefaultValues);
    },
  });

  async function handleSignOut() {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePickAvatar() {
    if (profileQuery.isPending || updateProfileMutation.isPending) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Không có quyền truy cập ảnh', 'Hãy cấp quyền thư viện ảnh để thay đổi hình đại diện.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.45,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];

    if (!asset.base64) {
      Alert.alert('Không thể đọc ảnh', 'Hãy chọn một ảnh khác có dung lượng nhỏ hơn.');
      return;
    }

    const avatarUrl = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;

    if (avatarUrl.length > avatarSizeLimit) {
      Alert.alert('Ảnh quá lớn', 'Hãy chọn ảnh vuông nhỏ hơn hoặc nén nhẹ hơn trước khi tải lên.');
      return;
    }

    setProfileNotice('Ảnh đã được chọn. Nhấn Lưu hồ sơ để xác nhận thay đổi.');
    setProfileValue('avatarUrl', avatarUrl, { shouldDirty: true, shouldValidate: true });
  }

  function handleRemoveAvatar() {
    setProfileNotice(null);
    setProfileValue('avatarUrl', null, { shouldDirty: true, shouldValidate: true });
  }

  const handleProfileSave = handleProfileSubmit(async (values) => {
    setProfileNotice(null);
    await updateProfileMutation.mutateAsync(values);
  });

  const handlePasswordSave = handlePasswordSubmit(async (values) => {
    setPasswordNotice(null);
    await changePasswordMutation.mutateAsync(values);
  });

  const activeAvatarUrl = avatarDraft === undefined ? (profileQuery.data?.avatarUrl ?? null) : avatarDraft;

  if (!sessionToken) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
        <View style={styles.content}>
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.stateTitle, { color: palette.text }]}>Phiên đăng nhập đã hết hạn</Text>
            <Text style={[styles.stateText, { color: palette.mutedText }]}>Vui lòng đăng nhập lại để xem cài đặt tài khoản.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
          {activeAvatarUrl ? (
            <Image source={{ uri: activeAvatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: palette.navy }]}>
              <Text style={styles.avatarText}>{getInitials(profileQuery.data?.fullName)}</Text>
            </View>
          )}

          <View style={styles.heroTextBlock}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>Cài đặt</Text>
            <Text style={[styles.title, { color: palette.text }]}>Cài đặt và tài khoản</Text>
            <Text style={[styles.description, { color: palette.mutedText }]}> 
              Quản lý hồ sơ đăng nhập, kết nối API và phiên làm việc của Finance Tracker trên thiết bị này.
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <View style={styles.infoHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Thông tin người dùng</Text>
            <Pressable
              onPress={() => profileQuery.refetch()}
              disabled={profileQuery.isPending}
              style={({ pressed }) => [
                styles.inlineAction,
                {
                  backgroundColor: palette.accentSoft,
                  opacity: profileQuery.isPending ? 0.6 : pressed ? 0.88 : 1,
                },
              ]}
            >
              <FontAwesome name="refresh" size={12} color={palette.accent} />
              <Text style={[styles.inlineActionText, { color: palette.accent }]}>Làm mới</Text>
            </Pressable>
          </View>

          {profileQuery.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={palette.accent} />
              <Text style={[styles.stateText, { color: palette.mutedText }]}>Đang đồng bộ thông tin hồ sơ.</Text>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={[styles.infoRow, { backgroundColor: palette.surfaceRaised }]}> 
                <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}> 
                  <FontAwesome name="user" size={16} color={palette.accent} />
                </View>
                <View style={styles.infoTextBlock}>
                  <Text style={[styles.infoLabel, { color: palette.mutedText }]}>Họ tên</Text>
                  <Text style={[styles.infoValue, { color: palette.text }]}>{profileQuery.data?.fullName || 'Chưa tải được hồ sơ'}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { backgroundColor: palette.surfaceRaised }]}> 
                <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}> 
                  <FontAwesome name="envelope-o" size={16} color={palette.accent} />
                </View>
                <View style={styles.infoTextBlock}>
                  <Text style={[styles.infoLabel, { color: palette.mutedText }]}>Email</Text>
                  <Text style={[styles.infoValue, { color: palette.text }]}>{profileQuery.data?.email || 'Đang chờ đồng bộ'}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { backgroundColor: palette.surfaceRaised }]}> 
                <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}> 
                  <FontAwesome name="link" size={16} color={palette.accent} />
                </View>
                <View style={styles.infoTextBlock}>
                  <Text style={[styles.infoLabel, { color: palette.mutedText }]}>Máy chủ dữ liệu</Text>
                  <Text numberOfLines={1} style={[styles.infoValue, { color: palette.text }]}>{env.apiBaseUrl}</Text>
                </View>
              </View>
            </View>
          )}

          {profileQuery.error ? (
            <View style={[styles.feedbackCard, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
              <Text style={[styles.feedbackText, { color: palette.danger }]}>{profileQuery.error.message}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Cập nhật hồ sơ</Text>
          <Text style={[styles.sectionDescription, { color: palette.mutedText }]}>Thay đổi họ tên hiển thị và hình đại diện sẽ được đồng bộ ngay với tài khoản hiện tại.</Text>

          <View style={[styles.avatarEditor, { backgroundColor: palette.surfaceRaised }]}> 
            {activeAvatarUrl ? (
              <Image source={{ uri: activeAvatarUrl }} style={styles.avatarPreview} />
            ) : (
              <View style={[styles.avatarPreviewFallback, { backgroundColor: palette.navy }]}> 
                <Text style={styles.avatarPreviewText}>{getInitials(profileQuery.data?.fullName)}</Text>
              </View>
            )}

            <View style={styles.avatarEditorTextBlock}>
              <Text style={[styles.avatarEditorTitle, { color: palette.text }]}>Hình đại diện</Text>
              <Text style={[styles.avatarEditorDescription, { color: palette.mutedText }]}>Chọn ảnh vuông nhẹ để tải nhanh hơn. Bạn cũng có thể gỡ ảnh để quay về avatar chữ cái.</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={handlePickAvatar}
              disabled={profileQuery.isPending || updateProfileMutation.isPending}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: palette.accentSoft,
                  opacity: pressed || profileQuery.isPending || updateProfileMutation.isPending ? 0.82 : 1,
                },
              ]}
            >
              <FontAwesome name="image" size={14} color={palette.accent} />
              <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>Chọn ảnh</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleRemoveAvatar}
              disabled={!activeAvatarUrl || updateProfileMutation.isPending}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: palette.surfaceRaised,
                  borderColor: palette.border,
                  opacity: pressed || !activeAvatarUrl || updateProfileMutation.isPending ? 0.7 : 1,
                },
              ]}
            >
              <FontAwesome name="trash-o" size={14} color={palette.text} />
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Gỡ ảnh</Text>
            </Pressable>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: palette.text }]}>Họ tên</Text>
            <Controller
              control={profileControl}
              name="fullName"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  autoCorrect={false}
                  cursorColor={palette.accent}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={palette.mutedText}
                  selectionColor={palette.accent}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: palette.surfaceRaised,
                      borderColor: profileErrors.fullName ? palette.danger : palette.border,
                      color: palette.text,
                    },
                  ]}
                  value={value}
                />
              )}
            />
            {profileErrors.fullName ? <Text style={[styles.fieldError, { color: palette.danger }]}>{profileErrors.fullName.message}</Text> : null}
          </View>

          {updateProfileMutation.error ? (
            <View style={[styles.feedbackCard, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
              <Text style={[styles.feedbackText, { color: palette.danger }]}>{getErrorMessage(updateProfileMutation.error)}</Text>
            </View>
          ) : null}

          {profileNotice ? (
            <View style={[styles.feedbackCard, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
              <Text style={[styles.feedbackText, { color: palette.text }]}>{profileNotice}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void handleProfileSave()}
            disabled={profileQuery.isPending || updateProfileMutation.isPending}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: palette.accent,
                opacity: pressed || profileQuery.isPending || updateProfileMutation.isPending ? 0.85 : 1,
              },
            ]}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Lưu hồ sơ</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Bảo mật tài khoản</Text>
          <Text style={[styles.sectionDescription, { color: palette.mutedText }]}>Đổi mật khẩu ngay trong phần cài đặt. Nếu mất mật khẩu hoàn toàn, bạn có thể mở nhanh màn hình khôi phục.</Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: palette.text }]}>Mật khẩu hiện tại</Text>
            <Controller
              control={passwordControl}
              name="currentPassword"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  cursorColor={palette.accent}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor={palette.mutedText}
                  secureTextEntry
                  selectionColor={palette.accent}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: palette.surfaceRaised,
                      borderColor: passwordErrors.currentPassword ? palette.danger : palette.border,
                      color: palette.text,
                    },
                  ]}
                  value={value}
                />
              )}
            />
            {passwordErrors.currentPassword ? <Text style={[styles.fieldError, { color: palette.danger }]}>{passwordErrors.currentPassword.message}</Text> : null}
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: palette.text }]}>Mật khẩu mới</Text>
            <Controller
              control={passwordControl}
              name="newPassword"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  cursorColor={palette.accent}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Tối thiểu 8 ký tự"
                  placeholderTextColor={palette.mutedText}
                  secureTextEntry
                  selectionColor={palette.accent}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: palette.surfaceRaised,
                      borderColor: passwordErrors.newPassword ? palette.danger : palette.border,
                      color: palette.text,
                    },
                  ]}
                  value={value}
                />
              )}
            />
            {passwordErrors.newPassword ? <Text style={[styles.fieldError, { color: palette.danger }]}>{passwordErrors.newPassword.message}</Text> : null}
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: palette.text }]}>Xác nhận mật khẩu mới</Text>
            <Controller
              control={passwordControl}
              name="confirmPassword"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  cursorColor={palette.accent}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor={palette.mutedText}
                  secureTextEntry
                  selectionColor={palette.accent}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: palette.surfaceRaised,
                      borderColor: passwordErrors.confirmPassword ? palette.danger : palette.border,
                      color: palette.text,
                    },
                  ]}
                  value={value}
                />
              )}
            />
            {passwordErrors.confirmPassword ? <Text style={[styles.fieldError, { color: palette.danger }]}>{passwordErrors.confirmPassword.message}</Text> : null}
          </View>

          {changePasswordMutation.error ? (
            <View style={[styles.feedbackCard, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
              <Text style={[styles.feedbackText, { color: palette.danger }]}>{getErrorMessage(changePasswordMutation.error)}</Text>
            </View>
          ) : null}

          {passwordNotice ? (
            <View style={[styles.feedbackCard, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}> 
              <Text style={[styles.feedbackText, { color: palette.text }]}>{passwordNotice}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void handlePasswordSave()}
            disabled={changePasswordMutation.isPending}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: palette.navy,
                opacity: pressed || changePasswordMutation.isPending ? 0.85 : 1,
              },
            ]}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Cập nhật mật khẩu</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/forgot-password')}
            style={({ pressed }) => [
              styles.secondaryAction,
              {
                backgroundColor: palette.surfaceRaised,
                borderColor: palette.border,
                opacity: pressed ? 0.84 : 1,
              },
            ]}
          >
            <FontAwesome name="life-ring" size={14} color={palette.text} />
            <Text style={[styles.secondaryActionText, { color: palette.text }]}>Mở màn hình quên mật khẩu</Text>
          </Pressable>
        </View>

        <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Phiên làm việc</Text>
          <Text style={[styles.sectionDescription, { color: palette.mutedText }]}>Phiên đăng nhập hiện tại đang được lưu an toàn trên thiết bị và dùng lại cho toàn bộ thao tác API.</Text>

          <View style={styles.sessionMetaRow}>
            <View style={[styles.sessionChip, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.sessionChipLabel, { color: palette.mutedText }]}>Máy chủ</Text>
              <Text style={[styles.sessionChipValue, { color: palette.text }]}>Đang hoạt động</Text>
            </View>

            <View style={[styles.sessionChip, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.sessionChipLabel, { color: palette.mutedText }]}>Bảo mật</Text>
              <Text style={[styles.sessionChipValue, { color: palette.text }]}>Lưu trữ an toàn</Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutButton,
            {
              backgroundColor: palette.danger,
              opacity: pressed || isSubmitting ? 0.88 : 1,
            },
          ]}
        >
          {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <FontAwesome name="sign-out" size={16} color="#ffffff" />}
          <Text style={styles.signOutButtonText}>{isSubmitting ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
        </Pressable>
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
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: financeFonts.extrabold,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 22,
  },
  heroTextBlock: {
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
  infoCard: {
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
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
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
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
  },
  inlineActionText: {
    fontSize: 12,
    fontFamily: financeFonts.bold,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: financeFonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: financeFonts.bold,
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
  avatarEditor: {
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  avatarPreviewFallback: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewText: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: financeFonts.extrabold,
  },
  avatarEditorTextBlock: {
    flex: 1,
    gap: 4,
  },
  avatarEditorTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: financeFonts.bold,
  },
  avatarEditorDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: financeFonts.regular,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: financeFonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: financeFonts.medium,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: financeFonts.medium,
  },
  primaryButton: {
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: financeFonts.bold,
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontFamily: financeFonts.bold,
  },
  sessionMetaRow: {
    gap: 10,
  },
  sessionChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  sessionChipLabel: {
    fontSize: 12,
    fontFamily: financeFonts.medium,
  },
  sessionChipValue: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: financeFonts.bold,
  },
  signOutButton: {
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: financeFonts.bold,
  },
});