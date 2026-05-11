"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { financeApi } from "@/lib/api";
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

  const isBusy = isLoading || isSubmittingAuth;

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

  return (
    <div className="rounded-[30px] border border-white/10 bg-slate-950/80 p-6 text-white shadow-[0_20px_60px_rgba(2,6,23,0.25)]">
      <p className="text-xs uppercase tracking-[0.26em] text-slate-300">
        Trạng thái dashboard
      </p>
      <p className="mt-4 text-2xl font-semibold">
        {source === "api" ? "Đang dùng API thật" : "Mock contract đang bật"}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Chu kỳ hiện tại: {periodLabel}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
            Route chính
          </p>
          <p className="mt-2 text-sm font-medium">/dashboard</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
            User hiện tại
          </p>
          <p className="mt-2 text-sm font-medium">
            {currentUser ? currentUser.email : "Chưa đăng nhập"}
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
            Phiên đăng nhập
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            {currentUser?.fullName} đang đăng nhập. Dashboard sẽ tự dùng access token đã lưu để đồng bộ dữ liệu thật.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-300"
              type="button"
              onClick={onRefresh}
              disabled={isBusy}
            >
              {isLoading ? "Đang đồng bộ" : "Đồng bộ lại"}
            </button>
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={onDisconnect}
              disabled={isBusy}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-blue-500 text-white"
                  : "border border-white/15 text-white hover:bg-white/5"
              }`}
              type="button"
              onClick={() => {
                setMode("login");
                setAuthErrorMessage(null);
              }}
              disabled={isBusy}
            >
              Đăng nhập
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-blue-500 text-white"
                  : "border border-white/15 text-white hover:bg-white/5"
              }`}
              type="button"
              onClick={() => {
                setMode("register");
                setAuthErrorMessage(null);
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
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Email
                <input
                  className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                  placeholder="you@example.com"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email ? (
                  <span className="text-sm text-orange-300">
                    {loginForm.formState.errors.email.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Mật khẩu
                <input
                  className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
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
                className="rounded-full bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={isBusy}
              >
                {isSubmittingAuth ? "Đang đăng nhập" : "Đăng nhập và đồng bộ"}
              </button>
            </form>
          ) : (
            <form
              className="mt-5 grid gap-4"
              onSubmit={registerForm.handleSubmit(handleRegister)}
            >
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Họ tên
                <input
                  className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                  placeholder="Nguyen Van A"
                  {...registerForm.register("fullName")}
                />
                {registerForm.formState.errors.fullName ? (
                  <span className="text-sm text-orange-300">
                    {registerForm.formState.errors.fullName.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Email
                <input
                  className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                  placeholder="you@example.com"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email ? (
                  <span className="text-sm text-orange-300">
                    {registerForm.formState.errors.email.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Mật khẩu
                <input
                  className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
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
                className="rounded-full bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={isBusy}
              >
                {isSubmittingAuth ? "Đang tạo tài khoản" : "Tạo tài khoản và đăng nhập"}
              </button>
            </form>
          )}
        </div>
      )}

      {authErrorMessage ? (
        <p className="mt-4 text-sm leading-6 text-red-300">{authErrorMessage}</p>
      ) : null}
      {helperMessage ? (
        <p className="mt-4 text-sm leading-6 text-emerald-300">{helperMessage}</p>
      ) : null}
      {errorMessage ? (
        <p className="mt-4 text-sm leading-6 text-red-300">{errorMessage}</p>
      ) : null}
    </div>
  );
}