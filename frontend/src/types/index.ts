export type UserRole = 'publisher' | 'reader' | null;

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}
