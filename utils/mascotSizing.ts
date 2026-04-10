/**
 * Hero owl — assessment intro; scales by height/width so the mascot fits narrow screens.
 */
export function getIntroMascotSize(width: number, height: number): number {
  const fromHeight = height * 0.26;
  const fromWidth = width * 0.65;
  const scaled = Math.min(fromHeight, fromWidth);
  return Math.round(Math.min(240, Math.max(140, scaled)));
}

export function getIntroMascotSectionMinHeight(width: number, height: number): number {
  return getIntroMascotSize(width, height) * 1.12;
}

/**
 * Onboarding slide 1 — smaller mascot and tighter section so text + cards fit (with scroll).
 */
export function getOnboardingHeroMascotSize(width: number, height: number): number {
  const fromHeight = height * 0.175;
  const fromWidth = width * 0.5;
  const scaled = Math.min(fromHeight, fromWidth);
  return Math.round(Math.min(156, Math.max(76, scaled)));
}

export function getOnboardingHeroSectionMinHeight(width: number, height: number): number {
  return getOnboardingHeroMascotSize(width, height) * 1.06;
}

/**
 * Smaller mascot in the onboarding mock (toast) — proportional to onboarding hero size.
 */
export function getOnboardingInlineMascotSize(width: number, height: number): number {
  const hero = getOnboardingHeroMascotSize(width, height);
  return Math.round(Math.max(36, Math.min(54, hero * 0.3)));
}
