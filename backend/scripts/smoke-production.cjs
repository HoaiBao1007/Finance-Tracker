const crypto = require("crypto");
const path = require("path");

const dotenv = require("dotenv");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

const envPath = path.resolve(__dirname, "../.env.production");
dotenv.config({ path: envPath });

const apiBaseUrl = process.env.SMOKE_API_BASE_URL ?? "https://api-production-9dae.up.railway.app/api/v1";
const frontendUrl = process.env.SMOKE_FRONTEND_URL ?? "https://finance-tracker-web-hoaibao1007s-projects.vercel.app";

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL is required. Expected in ${envPath}`);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ["error"],
});

const steps = [];

const logStep = (name, details) => {
  steps.push({ name, status: "ok", details });
  console.log(`[ok] ${name}${details ? `: ${details}` : ""}`);
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const buildSmokeEmail = () => {
  if (process.env.SMOKE_TEST_EMAIL) {
    return process.env.SMOKE_TEST_EMAIL;
  }

  const stamp = Date.now().toString(36);
  const senderEmail = process.env.SMOKE_RECIPIENT_EMAIL ?? process.env.SMTP_FROM_EMAIL ?? process.env.MAIL_FROM_EMAIL ?? "smoke@gmail.com";
  const [localPart, domain] = senderEmail.split("@");

  if (localPart && domain) {
    return `${localPart}+smoke-${stamp}@${domain}`;
  }

  return `smoke-${stamp}@gmail.com`;
};

const buildPassword = (prefix, stamp) => `${prefix}!${stamp}Aa1`;

const apiRequest = async (endpoint, { method = "GET", token, body, expectedStatus = 200, headers } = {}) => {
  const requestHeaders = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers ?? {}),
  };

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (response.status !== expectedStatus) {
    throw new Error(`${method} ${endpoint} returned ${response.status}: ${text}`);
  }

  return {
    response,
    payload,
  };
};

const crackOtpFromHash = (tokenHash) => {
  for (let candidate = 100000; candidate <= 999999; candidate += 1) {
    const otp = String(candidate);
    const digest = crypto.createHash("sha256").update(otp).digest("hex");

    if (digest === tokenHash) {
      return otp;
    }
  }

  throw new Error("Unable to derive OTP from token hash");
};

const getCurrentPeriod = () => {
  const now = new Date();

  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
    isoNow: now.toISOString(),
  };
};

const main = async () => {
  const stamp = Date.now().toString(36);
  const smokeEmail = buildSmokeEmail();
  const initialPassword = buildPassword("Smoke", stamp);
  const changedPassword = buildPassword("Change", stamp);
  const resetPassword = buildPassword("Reset", stamp);
  const { month, year, isoNow } = getCurrentPeriod();

  let activeToken = null;
  let createdBudgetId = null;
  const createdTransactionIds = [];
  let createdUserId = null;

  try {
    const frontendResponse = await fetch(frontendUrl, {
      redirect: "manual",
    });
    assert(frontendResponse.status >= 200 && frontendResponse.status < 400, `Frontend returned ${frontendResponse.status}`);
    const frontendLocation = frontendResponse.headers.get("location");
    logStep("frontend-root", frontendLocation ? `${frontendUrl} -> ${frontendLocation}` : frontendUrl);

    const health = await apiRequest("/health");
    assert(health.payload?.success === true, "Backend health payload is invalid");
    logStep("backend-health", health.payload?.data?.status ?? "ok");

    const corsProbe = await fetch(`${apiBaseUrl}/health`, {
      headers: {
        Origin: frontendUrl,
      },
    });
    assert(corsProbe.headers.get("access-control-allow-origin") === frontendUrl, "Backend CORS is not aligned with frontend domain");
    logStep("backend-cors", corsProbe.headers.get("access-control-allow-origin"));

    const register = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        email: smokeEmail,
        password: initialPassword,
        fullName: `Smoke Test ${stamp}`,
      },
      expectedStatus: 201,
    });
    activeToken = register.payload.data.accessToken;
    const userId = register.payload.data.user.id;
    createdUserId = userId;
    logStep("auth-register", smokeEmail);

    const loginInitial = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: smokeEmail,
        password: initialPassword,
      },
    });
    assert(typeof loginInitial.payload?.data?.accessToken === "string", "Initial login token missing");
    activeToken = loginInitial.payload.data.accessToken;
    logStep("auth-login-initial");

    const me = await apiRequest("/auth/me", {
      token: activeToken,
    });
    assert(me.payload?.data?.email === smokeEmail, "Current user email mismatch");
    logStep("auth-me", me.payload.data.email);

    const profileName = `Smoke Verified ${stamp}`;
    const profile = await apiRequest("/auth/profile", {
      method: "PATCH",
      token: activeToken,
      body: {
        fullName: profileName,
      },
    });
    assert(profile.payload?.data?.fullName === profileName, "Profile update failed");
    logStep("auth-profile-update", profileName);

    await apiRequest("/auth/change-password", {
      method: "POST",
      token: activeToken,
      body: {
        currentPassword: initialPassword,
        newPassword: changedPassword,
      },
    });
    logStep("auth-change-password");

    const loginChanged = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: smokeEmail,
        password: changedPassword,
      },
    });
    activeToken = loginChanged.payload.data.accessToken;
    logStep("auth-login-after-change");

    const categories = await apiRequest("/categories", {
      token: activeToken,
    });
    const expenseCategory = categories.payload.data.find((category) => category.type === "expense" && category.isDefault);
    const incomeCategory = categories.payload.data.find((category) => category.type === "income" && category.isDefault);
    assert(expenseCategory, "Default expense category not found");
    assert(incomeCategory, "Default income category not found");
    logStep("finance-categories", `${categories.payload.data.length} categories`);

    const incomeTransaction = await apiRequest("/transactions", {
      method: "POST",
      token: activeToken,
      body: {
        categoryId: incomeCategory.id,
        amount: "2000000",
        type: "income",
        date: isoNow,
        note: `Smoke income ${stamp}`,
      },
      expectedStatus: 201,
    });
    createdTransactionIds.push(incomeTransaction.payload.data.id);
    logStep("finance-create-income", incomeTransaction.payload.data.id);

    const expenseTransaction = await apiRequest("/transactions", {
      method: "POST",
      token: activeToken,
      body: {
        categoryId: expenseCategory.id,
        amount: "150000",
        type: "expense",
        date: isoNow,
        note: `Smoke expense ${stamp}`,
      },
      expectedStatus: 201,
    });
    createdTransactionIds.push(expenseTransaction.payload.data.id);
    const expenseTransactionId = expenseTransaction.payload.data.id;
    logStep("finance-create-expense", expenseTransactionId);

    const fetchedTransaction = await apiRequest(`/transactions/${expenseTransactionId}`, {
      token: activeToken,
    });
    assert(fetchedTransaction.payload.data.id === expenseTransactionId, "Transaction fetch mismatch");
    logStep("finance-get-transaction", expenseTransactionId);

    const updatedExpense = await apiRequest(`/transactions/${expenseTransactionId}`, {
      method: "PATCH",
      token: activeToken,
      body: {
        amount: "175000",
        note: `Smoke expense updated ${stamp}`,
      },
    });
    assert(updatedExpense.payload.data.amount === "175000", "Transaction update failed");
    logStep("finance-update-transaction", updatedExpense.payload.data.amount);

    const listedTransactions = await apiRequest(`/transactions?month=${month}&year=${year}&page=1&limit=20`, {
      token: activeToken,
    });
    const listedIds = listedTransactions.payload.data.map((item) => item.id);
    assert(createdTransactionIds.every((id) => listedIds.includes(id)), "Created transactions missing from list response");
    logStep("finance-list-transactions", `${listedTransactions.payload.data.length} items`);

    const createdBudget = await apiRequest("/budgets", {
      method: "POST",
      token: activeToken,
      body: {
        categoryId: expenseCategory.id,
        limitAmount: "500000",
        month,
        year,
      },
      expectedStatus: 201,
    });
    createdBudgetId = createdBudget.payload.data.id;
    logStep("finance-create-budget", createdBudgetId);

    const listedBudgets = await apiRequest(`/budgets?month=${month}&year=${year}`, {
      token: activeToken,
    });
    assert(listedBudgets.payload.data.some((budget) => budget.id === createdBudgetId), "Created budget missing from list response");
    logStep("finance-list-budgets", `${listedBudgets.payload.data.length} items`);

    const updatedBudget = await apiRequest(`/budgets/${createdBudgetId}`, {
      method: "PATCH",
      token: activeToken,
      body: {
        limitAmount: "550000",
      },
    });
    assert(updatedBudget.payload.data.limitAmount === "550000", "Budget update failed");
    logStep("finance-update-budget", updatedBudget.payload.data.limitAmount);

    const summary = await apiRequest(`/reports/summary?month=${month}&year=${year}`, {
      token: activeToken,
    });
    assert(BigInt(summary.payload.data.totalIncome) >= 2000000n, "Summary total income is lower than expected");
    assert(BigInt(summary.payload.data.totalExpense) >= 175000n, "Summary total expense is lower than expected");
    logStep("report-summary", `income=${summary.payload.data.totalIncome}, expense=${summary.payload.data.totalExpense}`);

    const byCategory = await apiRequest(`/reports/by-category?month=${month}&year=${year}`, {
      token: activeToken,
    });
    assert(byCategory.payload.data.categories.length > 0, "Category report is empty");
    logStep("report-by-category", `${byCategory.payload.data.categories.length} categories`);

    const monthlyTrend = await apiRequest(`/reports/monthly-trend?month=${month}&year=${year}&months=6`, {
      token: activeToken,
    });
    assert(monthlyTrend.payload.data.months.length > 0, "Monthly trend report is empty");
    logStep("report-monthly-trend", `${monthlyTrend.payload.data.months.length} months`);

    const dashboard = await apiRequest(`/reports/dashboard?month=${month}&year=${year}&months=6`, {
      token: activeToken,
    });
    assert(dashboard.payload.data.snapshot.source === "api", "Dashboard bundle did not return API source");
    assert(dashboard.payload.data.currentUser.email === smokeEmail, "Dashboard bundle current user mismatch");
    logStep("report-dashboard-bundle", dashboard.payload.data.snapshot.source);

    const forgotPassword = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: {
        email: smokeEmail,
      },
    });
    assert(forgotPassword.payload.data.delivered === true, "Forgot-password did not report delivered=true");
    logStep("auth-forgot-password");

    const latestReset = await prisma.passwordResetToken.findFirst({
      where: {
        userId,
        usedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert(latestReset, "Password reset token was not created");

    const otp = crackOtpFromHash(latestReset.tokenHash);
    logStep("auth-derive-otp", otp);

    await apiRequest("/auth/reset-password", {
      method: "POST",
      body: {
        email: smokeEmail,
        token: otp,
        newPassword: resetPassword,
      },
    });
    logStep("auth-reset-password");

    const loginReset = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: smokeEmail,
        password: resetPassword,
      },
    });
    activeToken = loginReset.payload.data.accessToken;
    logStep("auth-login-after-reset");

    await apiRequest(`/budgets/${createdBudgetId}`, {
      method: "DELETE",
      token: activeToken,
    });
    logStep("cleanup-delete-budget", createdBudgetId);
    createdBudgetId = null;

    for (const transactionId of createdTransactionIds.splice(0, createdTransactionIds.length)) {
      await apiRequest(`/transactions/${transactionId}`, {
        method: "DELETE",
        token: activeToken,
      });
      logStep("cleanup-delete-transaction", transactionId);
    }

    if (process.env.SMOKE_DELETE_USER === "true" && createdUserId) {
      await prisma.user.delete({
        where: {
          id: createdUserId,
        },
      });
      logStep("cleanup-delete-user", createdUserId);
      createdUserId = null;
    }

    console.log(JSON.stringify({
      success: true,
      apiBaseUrl,
      frontendUrl,
      smokeEmail,
      steps,
    }, null, 2));
  } finally {
    if (process.env.SMOKE_DELETE_USER === "true" && createdUserId) {
      try {
        await prisma.user.delete({
          where: {
            id: createdUserId,
          },
        });
      } catch {}
    }

    await prisma.$disconnect();
    await pool.end();
  }
};

main().catch((error) => {
  console.error("SMOKE_TEST_FAILED");
  console.error(error);
  process.exitCode = 1;
});