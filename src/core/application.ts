export type Provider = 'workday' | 'lever' | 'greenhouse' | 'ashby' | 'generic';
export type FieldKind = 'text' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'select' | 'combobox' | 'unknown';
export type FieldIntent =
  | 'first_name' | 'last_name' | 'full_name' | 'email' | 'phone' | 'city' | 'country'
  | 'linkedin' | 'github' | 'portfolio' | 'resume'
  | 'work_authorization' | 'requires_sponsorship'
  | 'family_employment_conflict' | 'restrictive_covenant' | 'profile_accuracy'
  | 'unknown';

export type NormalizedField = {
  key: string;
  label: string;
  kind: FieldKind;
  intent: FieldIntent;
  required: boolean;
  visible: boolean;
};

export type FillState = 'filled' | 'already_present' | 'unresolved' | 'blocked' | 'failed';
export type FillItem = { field: NormalizedField; state: FillState; message: string };
export type FillReport = { provider: Provider; stage?: string; items: FillItem[]; nextAction: 'advanced' | 'review' | 'waiting'; };
