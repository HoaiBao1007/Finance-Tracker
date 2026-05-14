"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { financeApi } from "@/lib/api";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/schemas/account-security.schema";
import type { AuthUser } from "@/types/finance";

type AccountSettingsCardProps = {
  currentUser: AuthUser | null;
  authToken: string;
  onProfileUpdated: (user: AuthUser) => void;
  onError: (message: string) => void;
  onSuccess: (title: string, message: string) => void;
};

const avatarFileSizeLimit = 1_500_000;

function getInitials(fullName?: string) {
  const trimmed = fullName?.trim();

  if (!trimmed) {
    return "FT";
  }

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể cập nhật hồ sơ lúc này.";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Không thể đọc ảnh đã chọn."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Không thể đọc ảnh đã chọn."));
    };

    reader.readAsDataURL(file);
  });
}

export function AccountSettingsCard({
  currentUser,
  authToken,
  onProfileUpdated,
  onError,
  onSuccess,
}: AccountSettingsCardProps) {
  const fileInputId = useId();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const changePasswordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setFullName(currentUser?.fullName ?? "");
    setAvatarUrl(currentUser?.avatarUrl ?? null);
    setSelectedFileName(null);
    setProfileNotice(null);
    setSecurityNotice(null);
    changePasswordForm.reset();
  }, [changePasswordForm, currentUser]);

  const initials = useMemo(() => getInitials(fullName || currentUser?.fullName), [currentUser?.fullName, fullName]);

  const canEdit = Boolean(currentUser && authToken.trim());

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileNotice("Vui lòng chọn một tệp ảnh hợp lệ.");
      event.target.value = "";
      return;
    }

    if (file.size > avatarFileSizeLimit) {
      setProfileNotice("Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn 1.5MB để tải lên nhanh và ổn định.");
      event.target.value = "";
      return;
    }

    try {
      const nextAvatarUrl = await readFileAsDataUrl(file);

      setAvatarUrl(nextAvatarUrl);
      setSelectedFileName(file.name);
      setProfileNotice("Ảnh đã được chọn. Nhấn Lưu hồ sơ để xác nhận thay đổi.");
    } catch (error) {
      setProfileNotice(getErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  function handleRemoveAvatar() {
    setAvatarUrl(null);
    setSelectedFileName(null);
    setProfileNotice("Ảnh đại diện sẽ được gỡ sau khi bạn bấm Lưu hồ sơ.");
  }

  async function handleSaveProfile() {
    if (!currentUser || !authToken.trim()) {
      onError("Cần đăng nhập trước khi cập nhật hồ sơ.");
      return;
    }

    setIsSavingProfile(true);
    setProfileNotice(null);

    try {
      const response = await financeApi.updateProfile(
        {
          fullName: fullName.trim(),
          avatarUrl,
        },
        authToken,
      );

      onProfileUpdated(response.data);
      setSelectedFileName(null);
      setProfileNotice("Hồ sơ đã được cập nhật.");
      onSuccess("Đã cập nhật hồ sơ", "Ảnh đại diện và thông tin tài khoản đã được lưu.");
    } catch (error) {
      const message = getErrorMessage(error);
      setProfileNotice(message);
      onError(message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(values: ChangePasswordFormValues) {
    if (!currentUser || !authToken.trim()) {
      onError("Cần đăng nhập trước khi đổi mật khẩu.");
      return;
    }

    setIsChangingPassword(true);
    setSecurityNotice(null);

    try {
      await financeApi.changePassword(
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        authToken,
      );

      changePasswordForm.reset();
      setSecurityNotice("Mật khẩu đã được cập nhật. Từ lần đăng nhập sau, hãy dùng mật khẩu mới.");
      onSuccess("Đã đổi mật khẩu", "Mật khẩu mới đã được lưu cho tài khoản hiện tại.");
    } catch (error) {
      const message = getErrorMessage(error);
      setSecurityNotice(message);
      onError(message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <Card className="overflow-hidden border-slate-200/90 bg-white shadow-[0_24px_72px_rgba(15,23,42,0.07)]">
      <CardContent className="space-y-5 p-6 sm:p-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Tài khoản
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            Ảnh đại diện và hồ sơ
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            Chọn ảnh từ máy tính, xem trước ngay trên dashboard và bấm Lưu hồ sơ để xác nhận thay đổi.
          </p>
        </div>

        {canEdit ? (
          <>
            <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
              {avatarUrl ? (
                <img
                  alt="Ảnh đại diện hiện tại"
                  className="h-24 w-24 rounded-[26px] object-cover shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                  src={avatarUrl}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-slate-900 text-3xl font-semibold text-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
                  {initials}
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-base font-semibold text-slate-950">{currentUser?.fullName}</p>
                  <p className="text-sm text-slate-600">{currentUser?.email}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.25)] transition hover:bg-blue-500">
                    Chọn ảnh
                    <input
                      accept="image/*"
                      className="sr-only"
                      id={fileInputId}
                      type="file"
                      onChange={handleAvatarChange}
                    />
                  </label>
                  <Button
                    className="rounded-full"
                    disabled={isSavingProfile}
                    type="button"
                    variant="outline"
                    onClick={handleRemoveAvatar}
                  >
                    Gỡ ảnh
                  </Button>
                </div>
                {selectedFileName ? (
                  <p className="text-sm text-slate-500">Đã chọn: {selectedFileName}</p>
                ) : null}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Họ tên hiển thị
              <input
                className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>

            {profileNotice ? (
              <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {profileNotice}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full"
                disabled={isSavingProfile || !fullName.trim()}
                type="button"
                onClick={handleSaveProfile}
              >
                {isSavingProfile ? "Đang lưu hồ sơ" : "Lưu hồ sơ"}
              </Button>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Bảo mật
                </p>
                <h4 className="text-xl font-semibold tracking-tight text-slate-950">
                  Đổi mật khẩu
                </h4>
                <p className="text-sm leading-6 text-slate-600">
                  Đổi mật khẩu trực tiếp từ website. Nếu bạn quên hoàn toàn mật khẩu, dùng mục Quên mật khẩu ở card đăng nhập bên cạnh.
                </p>
              </div>

              <form className="mt-5 grid gap-4" onSubmit={changePasswordForm.handleSubmit(handleChangePassword)}>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Mật khẩu hiện tại
                  <input
                    className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    placeholder="Nhập mật khẩu hiện tại"
                    type="password"
                    {...changePasswordForm.register("currentPassword")}
                  />
                  {changePasswordForm.formState.errors.currentPassword ? (
                    <span className="text-sm text-rose-600">
                      {changePasswordForm.formState.errors.currentPassword.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Mật khẩu mới
                  <input
                    className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    placeholder="Tối thiểu 8 ký tự"
                    type="password"
                    {...changePasswordForm.register("newPassword")}
                  />
                  {changePasswordForm.formState.errors.newPassword ? (
                    <span className="text-sm text-rose-600">
                      {changePasswordForm.formState.errors.newPassword.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Xác nhận mật khẩu mới
                  <input
                    className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    placeholder="Nhập lại mật khẩu mới"
                    type="password"
                    {...changePasswordForm.register("confirmPassword")}
                  />
                  {changePasswordForm.formState.errors.confirmPassword ? (
                    <span className="text-sm text-rose-600">
                      {changePasswordForm.formState.errors.confirmPassword.message}
                    </span>
                  ) : null}
                </label>

                {securityNotice ? (
                  <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {securityNotice}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-full" disabled={isChangingPassword} type="submit">
                    {isChangingPassword ? "Đang cập nhật mật khẩu" : "Cập nhật mật khẩu"}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
            Hãy đăng nhập ở thẻ kết nối backend trước khi dùng tính năng cập nhật ảnh đại diện và đổi mật khẩu trên website.
          </div>
        )}
      </CardContent>
    </Card>
  );
}