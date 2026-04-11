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
  /** Match `OwlMascot` outer container (~1.42×) so the hero isn’t clipped */
  return getIntroMascotSize(width, height) * 1.42;
}

/**
 * Onboarding slide 3 — small owl in the mock toast (independent of slide 1 layout).
 */
export function getOnboardingInlineMascotSize(width: number, height: number): number {
  return Math.round(Math.max(32, Math.min(52, Math.min(width, height) * 0.068)));
}
