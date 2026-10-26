/**
 * Onboarding state helpers.
 *
 * Canonical four-field model (every company doc in the DB carries exactly
 * these four fields, see backend `companyinfo.ts`):
 *   signupOnboardingStep       1=register APIs, 2=UI selection, 3=provisioned
 *   isSignupOnboardingDone     boolean — signup onboarding finished
 *   dashboardOnboardingStep    1=MCP, 2=Plans, 3=Deploy (current unlocked
 *                              step; NEVER 4)
 *   isDashboardOnboardingDone  boolean — dashboard onboarding finished
 *
 * The legacy `user.onboardingStep` field belongs to the old signup phase
 * (1 registered, 2 APIs, 3 UI selection). It is intentionally ignored here.
 */
export type OnboardingTrackingUser = {
  dashboardOnboardingStep?: number | null;
  isDashboardOnboardingDone?: boolean | null;
} | null;

/** Current unlocked dashboard step, always clamped to 1..3. */
export const getDashboardOnboardingStep = (
  user?: OnboardingTrackingUser,
): number => {
  const raw = Number(user?.dashboardOnboardingStep ?? 1);
  return Math.min(Math.max(Math.floor(raw) || 1, 1), 3);
};

/**
 * Dashboard onboarding completion. `isDashboardOnboardingDone` is the
 * canonical flag; the `>= 4` fallback only covers stale persisted client
 * state written by the interim convention before the boolean existed.
 */
export const isDashboardOnboardingDone = (
  user?: OnboardingTrackingUser,
): boolean =>
  user?.isDashboardOnboardingDone === true ||
  Number(user?.dashboardOnboardingStep) >= 4;
