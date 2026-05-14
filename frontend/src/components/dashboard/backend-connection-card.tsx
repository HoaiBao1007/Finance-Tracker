"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { financeApi } from "@/lib/api";
import {
  passwordRecoveryRequestSchema,
  passwordResetFormSchema,
  type PasswordRecoveryRequestValues,
  type PasswordResetFormValues,
} from "@/schemas/account-security.schema";
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/schemas/auth-form.schema";
import type { AuthPayload, AuthUser } from "@/types/finance";
import { useState } from "react";
import { useForm } from "react-hook-form";

type BackendConnectionCardProps = {
  onAuthenticated: (payload: AuthPayload, mode: "login" | "register") => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  currentUser: AuthUser | null;
  source: "mock" | "api";
  periodLabel: string;
  isLoading: boolean;
  errorMessage: string | null;
  helperMessage: string | null;
};

export function BackendConnectionCard({
  onAuthenticated,
  onDisconnect,
  onRefresh,
  currentUser,
  source,
  periodLabel,
  isLoading,
  errorMessage,
  helperMessage,
}: BackendConnectionCardProps) {
  const isConnected = Boolean(currentUser);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recoveryErrorMessage, setRecoveryErrorMessage] = useState<string | null>(null);
  const [isSubmittingRecovery, setIsSubmittingRecovery] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const requestResetForm = useForm<PasswordRecoveryRequestValues>({
    resolver: zodResolver(passwordRecoveryRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetFormSchema),
    defaultValues: {
      email: "",
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const isBusy = isLoading || isSubmittingAuth || isSubmittingRecovery;

  async function handleLogin(values: LoginFormValues) {
    setIsSubmittingAuth(true);
    setAuthErrorMessage(null);

    try {
      const response = await financeApi.login(values);
      onAuthenticated(response.data, "login");
      loginForm.reset();
    } catch (error) {
      setAuthErrorMessage(
        error instanceof Error ? error.message : "Không thể đăng nhập lúc này.",
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleRegister(values: RegisterFormValues) {
    setIsSubmittingAuth(true);
    setAuthErrorMessage(null);

    try {
      const response = await financeApi.register(values);
      onAuthenticated(response.data, "register");
      registerForm.reset();
    } catch (error) {
      setAuthErrorMessage(
        error instanceof Error ? error.message : "Không thể tạo tài khoản lúc này.",
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleRequestPasswordReset(values: PasswordRecoveryRequestValues) {
    setIsSubmittingRecovery(true);
    setRecoveryErrorMessage(null);
    setRecoveryMessage(null);

    try {
      const response = await financeApi.requestPasswordReset({
        email: values.email.trim(),
      });

      resetPasswordForm.setValue("email", values.email.trim(), { shouldValidate: true });
      resetPasswordForm.setValue("token", "", { shouldValidate: false });
      setRecoveryMessage(
        response.data.expiresAt
          ? "Nếu email tồn tại, mã OTP đã được gửi tới email của bạn. Hãy kiểm tra Inbox hoặc Spam rồi nhập OTP vào biểu mẫu bên dưới."
          : "Nếu email tồn tại, mã OTP đã được gửi tới email của bạn. Hãy kiểm tra Inbox hoặc Spam để tiếp tục đặt lại mật khẩu.",
      );
    } catch (error) {
      setRecoveryErrorMessage(
        error instanceof Error ? error.message : "Không thể gửi OTP lúc này.",
      );
    } finally {
      setIsSubmittingRecovery(false);
    }
  }

  async function handleResetPassword(values: PasswordResetFormValues) {
    setIsSubmittingRecovery(true);
    setRecoveryErrorMessage(null);
    setRecoveryMessage(null);

    try {
      await financeApi.resetPassword({
        email: values.email.trim(),
        token: values.token.trim(),
        newPassword: values.newPassword,
      });

      resetPasswordForm.reset({
        email: values.email.trim(),
        token: "",
        newPassword: "",
        confirmPassword: "",
      });
      loginForm.setValue("email", values.email.trim(), { shouldValidate: true });
      loginForm.setValue("password", values.newPassword, { shouldValidate: false });
      setRecoveryMessage("Mật khẩu đã được đặt lại. Bạn có thể đăng nhập ngay bằng mật khẩu mới.");
      setIsRecoveryOpen(false);
    } catch (error) {
      setRecoveryErrorMessage(
        error instanceof Error ? error.message : "Không thể đặt lại mật khẩu lúc này.",
      );
    } finally {
      setIsSubmittingRecovery(false);
    }
  }

  function openRecoveryPanel() {
    setIsRecoveryOpen(true);
    setRecoveryErrorMessage(null);
    setRecoveryMessage(null);
    requestResetForm.setValue("email", loginForm.getValues("email"), { shouldValidate: false });
    resetPasswordForm.setValue("email", loginForm.getValues("email"), { shouldValidate: false });
  }

  return (
    <div className="rounded-[34px] border border-slate-200/90 bg-white p-6 text-slate-900 shadow-[0_24px_72px_rgba(15,23,42,0.07)] sm:p-7">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
        Trạng thái dashboard
      </p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
        {source === "api" ? "Đã kết nối dữ liệu thật" : "Đang ở chế độ mock"}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Chu kỳ hiện tại: {periodLabel}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Route chính
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">/dashboard</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            User hiện tại
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {currentUser ? currentUser.email : "Chưa đăng nhập"}
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Phiên đăng nhập
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {currentUser?.fullName} đang đăng nhập. Dashboard sẽ tự dùng access token đã lưu để đồng bộ dữ liệu thật.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
              type="button"
              onClick={onRefresh}
              disabled={isBusy}
            >
              {isLoading ? "Đang đồng bộ" : "Đồng bộ lại"}
            </button>
            <button
              className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={onDisconnect}
              disabled={isBusy}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-white"
              }`}
              type="button"
              onClick={() => {
                setMode("login");
                setAuthErrorMessage(null);
                setIsRecoveryOpen(false);
                setRecoveryMessage(null);
                setRecoveryErrorMessage(null);
              }}
              disabled={isBusy}
            >
              Đăng nhập
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-white"
              }`}
              type="button"
              onClick={() => {
                setMode("register");
                setAuthErrorMessage(null);
                setIsRecoveryOpen(false);
                setRecoveryMessage(null);
                setRecoveryErrorMessage(null);
              }}
              disabled={isBusy}
            >
              Tạo tài khoản
            </button>
          </div>

          {mode === "login" ? (
            <form
              className="mt-5 grid gap-4"
              onSubmit={loginForm.handleSubmit(handleLogin)}
            >
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Email
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  placeholder="you@example.com"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email ? (
                  <span className="text-sm text-orange-300">
                    {loginForm.formState.errors.email.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Mật khẩu
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  type="password"
                  placeholder="Password123"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password ? (
                  <span className="text-sm text-orange-300">
                    {loginForm.formState.errors.password.message}
                  </span>
                ) : null}
              </label>

              <button
                className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={isBusy}
              >
                {isSubmittingAuth ? "Đang đăng nhập" : "Đăng nhập và đồng bộ"}
              </button>

              <button
                className="justify-self-start text-sm font-semibold text-blue-600 transition hover:text-blue-500"
                type="button"
                onClick={openRecoveryPanel}
                disabled={isBusy}
              >
                Quên mật khẩu?
              </button>
            </form>
          ) : (
            <form
              className="mt-5 grid gap-4"
              onSubmit={registerForm.handleSubmit(handleRegister)}
            >
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Họ tên
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  placeholder="Nguyen Van A"
                  {...registerForm.register("fullName")}
                />
                {registerForm.formState.errors.fullName ? (
                  <span className="text-sm text-orange-300">
                    {registerForm.formState.errors.fullName.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Email
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  placeholder="you@example.com"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email ? (
                  <span className="text-sm text-orange-300">
                    {registerForm.formState.errors.email.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Mật khẩu
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  type="password"
                  placeholder="Password123"
                  {...registerForm.register("password")}
                />
                {registerForm.formState.errors.password ? (
                  <span className="text-sm text-orange-300">
                    {registerForm.formState.errors.password.message}
                  </span>
                ) : null}
              </label>

              <button
                className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={isBusy}
              >
                {isSubmittingAuth ? "Đang tạo tài khoản" : "Tạo tài khoản và đăng nhập"}
              </button>
            </form>
          )}

          {mode === "login" && isRecoveryOpen ? (
            <div className="mt-5 space-y-4 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Khôi phục mật khẩu bằng OTP</p>
                <p className="text-sm leading-6 text-slate-600">
                  Yêu cầu OTP qua email trước, sau đó nhập OTP và mật khẩu mới để đặt lại tài khoản ngay trên website.
                </p>
              </div>

              <form className="grid gap-3" onSubmit={requestResetForm.handleSubmit(handleRequestPasswordReset)}>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Email nhận OTP
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    placeholder="you@example.com"
                    {...requestResetForm.register("email")}
                  />
                  {requestResetForm.formState.errors.email ? (
                    <span className="text-sm text-rose-600">
                      {requestResetForm.formState.errors.email.message}
                    </span>
                  ) : null}
                </label>

                <button
                  className="justify-self-start rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={isBusy}
                >
                  {isSubmittingRecovery ? "Đang gửi OTP" : "Gửi mã OTP"}
                </button>
              </form>

              <form className="grid gap-3" onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)}>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Email tài khoản
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    placeholder="you@example.com"
                    {...resetPasswordForm.register("email")}
                  />
                  {resetPasswordForm.formState.errors.email ? (
                    <span className="text-sm text-rose-600">
                      {resetPasswordForm.formState.errors.email.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Mã OTP
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    inputMode="numeric"
                    placeholder="Nhập 6 số OTP"
                    {...resetPasswordForm.register("token")}
                  />
                  {resetPasswordForm.formState.errors.token ? (
                    <span className="text-sm text-rose-600">
                      {resetPasswordForm.formState.errors.token.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Mật khẩu mới
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    type="password"
                    placeholder="Tối thiểu 8 ký tự"
                    {...resetPasswordForm.register("newPassword")}
                  />
                  {resetPasswordForm.formState.errors.newPassword ? (
                    <span className="text-sm text-rose-600">
                      {resetPasswordForm.formState.errors.newPassword.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Xác nhận mật khẩu mới
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    {...resetPasswordForm.register("confirmPassword")}
                  />
                  {resetPasswordForm.formState.errors.confirmPassword ? (
                    <span className="text-sm text-rose-600">
                      {resetPasswordForm.formState.errors.confirmPassword.message}
                    </span>
                  ) : null}
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                    type="submit"
                    disabled={isBusy}
                  >
                    {isSubmittingRecovery ? "Đang đặt lại mật khẩu" : "Đặt lại mật khẩu"}
                  </button>
                  <button
                    className="rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    onClick={() => {
                      setIsRecoveryOpen(false);
                      setRecoveryErrorMessage(null);
                      setRecoveryMessage(null);
                    }}
                    disabled={isBusy}
                  >
                    Đóng
                  </button>
                </div>
              </form>

              {recoveryMessage ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                  {recoveryMessage}
                </p>
              ) : null}
              {recoveryErrorMessage ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  {recoveryErrorMessage}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {authErrorMessage ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {authErrorMessage}
        </p>
      ) : null}
      {helperMessage ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {helperMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}