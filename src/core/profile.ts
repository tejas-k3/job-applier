export type AttestationRule = {
  intent: 'family_employment_conflict' | 'restrictive_covenant' | 'profile_accuracy';
  answer: boolean;
  enabled: boolean;
};

export type CandidateProfile = {
  schema_version: 1;
  identity: {
    first_name: string;
    last_name: string;
    email: string;
    phone_e164: string;
    location: { city: string; region: string; country: string };
    links: { linkedin: string; github: string; portfolio: string };
  };
  employment: {
    work_authorization: string[];
    requires_sponsorship: boolean | null;
    notice_period: string;
  };
  experience: Array<{ company: string; title: string; summary: string; location?: string; start_date?: string; end_date?: string }>;
  education: Array<{ school: string; degree: string; field_of_study?: string; start_date?: string; end_date?: string }>;
  skills: string[];
  attestation_rules: AttestationRule[];
};

export const emptyProfile: CandidateProfile = {
  schema_version: 1,
  identity: {
    first_name: '', last_name: '', email: '', phone_e164: '',
    location: { city: '', region: '', country: '' },
    links: { linkedin: '', github: '', portfolio: '' }
  },
  employment: { work_authorization: [], requires_sponsorship: null, notice_period: '' },
  experience: [], education: [], skills: [],
  attestation_rules: [
    { intent: 'family_employment_conflict', answer: false, enabled: true },
    { intent: 'restrictive_covenant', answer: false, enabled: true },
    { intent: 'profile_accuracy', answer: true, enabled: false }
  ]
};

export function isProfile(value: unknown): value is CandidateProfile {
  const profile = value as Partial<CandidateProfile>;
  return profile?.schema_version === 1 && Boolean(profile.identity) && Boolean(profile.employment);
}
