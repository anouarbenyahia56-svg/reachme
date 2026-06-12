/**
 * ReachMe API client.
 *
 * Every function in this module maps 1:1 to a backend endpoint.
 * Today, each function is a typed placeholder that simulates the
 * real call with a brief delay and returns the expected shape.
 *
 * When the backend ships, replace each function body with a real
 * fetch call. The rest of the app — stores, screens, components —
 * already consumes these functions by name, so the swap is local.
 *
 * Conventions:
 *   • Amounts are integer cents.
 *   • Times are ISO 8601 strings.
 *   • Errors throw `ApiError` with a stable `code` and human `message`.
 *   • Every function is async — even local stubs — so the call
 *     sites already handle promises correctly.
 */

// ─── Error ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Config ────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      // TODO: wire to real auth — Authorization: `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
    credentials: "include",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(
      json?.code ?? `HTTP_${res.status}`,
      json?.message ?? res.statusText,
      res.status,
    );
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Simulate ──────────────────────────────────────────────────────────────

/** Simulates a brief network delay for local stubs. */
function simulate(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  hasProfile: boolean;
  hasPassword: boolean;
  verified: boolean;
}

/** POST /auth/login */
export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  // TODO: wire to backend
  await simulate();
  void email;
  void password;
  throw new ApiError("NOT_IMPLEMENTED", "Login requires backend integration.");
}

/** POST /auth/signup */
export async function signup(
  email: string,
  handle: string,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  await simulate();
  void email;
  void handle;
  throw new ApiError("NOT_IMPLEMENTED", "Signup requires backend integration.");
}

/** POST /auth/logout */
export async function logout(): Promise<void> {
  await simulate(100);
}

/** POST /auth/forgot-password */
export async function forgotPassword(email: string): Promise<void> {
  await simulate();
  void email;
}

/** POST /auth/reset-password */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await simulate();
  void token;
  void newPassword;
}

/** POST /auth/verify-email */
export async function verifyEmail(token: string): Promise<void> {
  await simulate();
  void token;
}

/** POST /auth/resend-verification */
export async function resendVerification(email: string): Promise<void> {
  await simulate(200);
  void email;
}

// ─── Handles ───────────────────────────────────────────────────────────────

export interface HandleCheckResult {
  available: boolean;
  reason?: "reserved" | "taken" | "invalid";
}

/** GET /handles/:handle/check */
export async function checkHandle(
  handle: string,
  signal?: AbortSignal,
): Promise<HandleCheckResult> {
  // TODO: wire to backend — replace with:
  //   return request("GET", `/handles/${handle}/check`, undefined, signal);
  await simulate(250);
  void signal;
  void handle;
  return { available: true };
}

// ─── Email ─────────────────────────────────────────────────────────────────

export interface EmailCheckResult {
  registered: boolean;
}

/** GET /email/check?email=:email */
export async function checkEmail(
  email: string,
  signal?: AbortSignal,
): Promise<EmailCheckResult> {
  await simulate(200);
  void signal;
  void email;
  return { registered: false };
}

// ─── Profile ───────────────────────────────────────────────────────────────

export type ApiProfile = import("../types").Profile;

/** GET /profile */
export async function getMyProfile(): Promise<ApiProfile | null> {
  // TODO: wire to backend
  await simulate();
  return null;
}

/** PUT /profile */
export async function updateProfile(
  updates: Partial<ApiProfile>,
): Promise<ApiProfile> {
  await simulate();
  void updates;
  throw new ApiError("NOT_IMPLEMENTED", "Profile update requires backend.");
}

/** GET /:handle (public) */
export async function getPublicProfile(
  handle: string,
): Promise<ApiProfile | null> {
  await simulate();
  void handle;
  return null;
}

// ─── Requests ──────────────────────────────────────────────────────────────

export type ApiRequestRecord = import("../types").RequestRecord;

export interface SubmitRequestInput {
  toHandle: string;
  from: {
    name: string;
    email: string;
    context?: string;
    organization?: string;
  };
  category: string;
  subject: string;
  message: string;
  amountCents: number;
}

export interface SubmitRequestResult {
  ok: boolean;
  record?: ApiRequestRecord;
  reason?: string;
}

/** POST /requests */
export async function submitRequest(
  input: SubmitRequestInput,
): Promise<SubmitRequestResult> {
  await simulate();
  void input;
  throw new ApiError("NOT_IMPLEMENTED", "Request submission requires backend.");
}

/** GET /requests/received */
export async function getReceivedRequests(): Promise<ApiRequestRecord[]> {
  await simulate();
  return [];
}

/** GET /requests/sent */
export async function getSentRequests(): Promise<ApiRequestRecord[]> {
  await simulate();
  return [];
}

/** GET /requests/:id */
export async function getRequest(
  id: string,
): Promise<ApiRequestRecord | null> {
  await simulate();
  void id;
  return null;
}

export interface ReplyInput {
  requestId: string;
  body: string;
  attachments?: Array<{
    type: "image" | "voice" | "video" | "file";
    name: string;
    url: string;
  }>;
}

/** POST /requests/:id/reply */
export async function replyToRequest(
  input: ReplyInput,
): Promise<{ ok: boolean; record?: ApiRequestRecord; reason?: string }> {
  await simulate();
  void input;
  throw new ApiError("NOT_IMPLEMENTED", "Reply requires backend.");
}

/** GET /conversations/:id */
export async function getConversation(
  conversationId: string,
): Promise<ApiRequestRecord[]> {
  await simulate();
  void conversationId;
  return [];
}

// ─── Earnings ──────────────────────────────────────────────────────────────

export interface EarningsSummary {
  lifetimeNetCents: number;
  lifetimeReplyCount: number;
  availableBalance: number;
  thisMonthCents: number;
  pendingEscrowCents: number;
  pendingRequestCount: number;
  totalWithdrawnCents: number;
}

export interface EarningEntry {
  id: string;
  date: string;
  category: string;
  amountCents: number;
}

/** GET /earnings/summary */
export async function getEarningsSummary(): Promise<EarningsSummary> {
  await simulate();
  return {
    lifetimeNetCents: 0,
    lifetimeReplyCount: 0,
    availableBalance: 0,
    thisMonthCents: 0,
    pendingEscrowCents: 0,
    pendingRequestCount: 0,
    totalWithdrawnCents: 0,
  };
}

/** GET /earnings/history */
export async function getEarningsHistory(): Promise<EarningEntry[]> {
  await simulate();
  return [];
}

// ─── Withdrawals ───────────────────────────────────────────────────────────

export type ApiWithdrawal = import("../types").Withdrawal;

export interface WithdrawalInput {
  amountCents: number;
  method: {
    kind: string;
    label: string;
    lastFour: string;
  };
}

/** POST /withdrawals */
export async function requestWithdrawal(
  input: WithdrawalInput,
): Promise<ApiWithdrawal> {
  await simulate();
  void input;
  throw new ApiError("NOT_IMPLEMENTED", "Withdrawal requires backend.");
}

/** GET /withdrawals */
export async function getWithdrawals(): Promise<ApiWithdrawal[]> {
  await simulate();
  return [];
}

// ─── Payout Method ─────────────────────────────────────────────────────────

export type ApiPayoutMethod = import("../types").PayoutMethod;

/** GET /payout-method */
export async function getPayoutMethod(): Promise<ApiPayoutMethod | null> {
  await simulate();
  return null;
}

/** POST /payout-method/connect (initiates Stripe Connect OAuth) */
export async function connectBankAccount(): Promise<{ oauthUrl: string }> {
  await simulate();
  throw new ApiError(
    "NOT_IMPLEMENTED",
    "Bank connection requires Stripe Connect integration.",
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────

export interface AccountSettings {
  email: string;
  hasPassword: boolean;
  connectedProviders: Array<{
    provider: "google" | "apple";
    email: string;
    connected: boolean;
  }>;
}

/** GET /settings/account */
export async function getAccountSettings(): Promise<AccountSettings> {
  await simulate();
  return {
    email: "",
    hasPassword: false,
    connectedProviders: [
      { provider: "google", email: "", connected: false },
      { provider: "apple", email: "", connected: false },
    ],
  };
}

/** PUT /settings/account/email */
export async function updateEmail(email: string): Promise<void> {
  await simulate();
  void email;
}

/** POST /settings/account/password */
export async function updatePassword(
  currentPassword: string | null,
  newPassword: string,
): Promise<void> {
  await simulate();
  void currentPassword;
  void newPassword;
}

/** POST /settings/account/connect/:provider */
export async function connectSocial(
  provider: "google" | "apple",
): Promise<{ oauthUrl: string }> {
  await simulate();
  void provider;
  throw new ApiError("NOT_IMPLEMENTED", "Social connect requires backend.");
}

/** DELETE /settings/account/connect/:provider */
export async function disconnectSocial(
  provider: "google" | "apple",
): Promise<void> {
  await simulate();
  void provider;
}

/** GET /settings/notifications */
export async function getNotificationPrefs(): Promise<Record<string, boolean>> {
  await simulate();
  return {};
}

/** PUT /settings/notifications */
export async function updateNotificationPrefs(
  prefs: Record<string, boolean>,
): Promise<void> {
  await simulate();
  void prefs;
}

export interface ActiveSession {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

/** GET /settings/security/sessions */
export async function getSessions(): Promise<ActiveSession[]> {
  await simulate();
  return [];
}

/** DELETE /settings/security/sessions/:id */
export async function revokeSession(sessionId: string): Promise<void> {
  await simulate();
  void sessionId;
}

/** POST /settings/security/2fa/enable */
export async function enable2FA(): Promise<{ qrCodeUrl: string; secret: string }> {
  await simulate();
  throw new ApiError("NOT_IMPLEMENTED", "2FA requires backend.");
}

/** POST /settings/security/2fa/disable */
export async function disable2FA(): Promise<void> {
  await simulate();
}

/** GET /settings/security/2fa/status */
export async function get2FAStatus(): Promise<{ enabled: boolean }> {
  await simulate();
  return { enabled: false };
}

// ─── Account Actions ───────────────────────────────────────────────────────

/** POST /settings/account/deactivate */
export async function deactivateAccount(): Promise<void> {
  await simulate();
}

/** DELETE /settings/account */
export async function deleteAccount(): Promise<void> {
  await simulate();
}
