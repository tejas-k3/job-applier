import type { AttestationRule, CandidateProfile } from './profile';

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function profileValueForLabel(label: string, profile: CandidateProfile): string | undefined {
  return profileValueForOccurrence(label, profile, 0);
}

export function profileValueForOccurrence(label: string, profile: CandidateProfile, occurrence: number): string | undefined {
  const normalized = normalizeText(label);
  const { identity } = profile;
  if (/^name$|full name|legal name/.test(normalized)) return `${identity.first_name} ${identity.last_name}`.trim();
  if (/\b(last|family|surname)\b/.test(normalized)) return identity.last_name;
  if (/\b(first|given)\b/.test(normalized)) return identity.first_name;
  if (/email/.test(normalized)) return identity.email;
  if (/nationality/.test(normalized)) return identity.nationality;
  if (/\b(phone|mobile|telephone)\b/.test(normalized)) return identity.phone_e164;
  if (/linkedin/.test(normalized)) return identity.links.linkedin;
  if (/github/.test(normalized)) return identity.links.github;
  if (/portfolio personal website website url/.test(normalized)) return identity.links.portfolio;
  if (/city/.test(normalized)) return identity.location.city;
  if (/country/.test(normalized)) return identity.location.country;
  const experience = profile.experience[occurrence];
  const education = profile.education[occurrence];
  const isEducation = /\b(education|school|university|college|degree|major|field of study)\b/.test(normalized);
  if (/\b(start|begin) date\b/.test(normalized)) {
    return isEducation ? education?.start_date : experience?.start_date;
  }
  if (/\b(end|finish) date\b/.test(normalized)) {
    return isEducation ? education?.end_date : experience?.end_date;
  }
  if (experience) {
    if (/\b(company|employer|organization)\b/.test(normalized)) return experience.company;
    if (/\b(job title|position title|title)\b/.test(normalized)) return experience.title;
    if (/\b(description|responsibilities|summary)\b/.test(normalized)) return experience.summary;
    if (/\b(work location|employer location)\b/.test(normalized)) return experience.location;
  }
  if (education) {
    if (/\b(school|university|college|institution)\b/.test(normalized)) return education.school;
    if (/\b(degree)\b/.test(normalized)) return education.degree;
    if (/\b(field of study|major|specialization)\b/.test(normalized)) return education.field_of_study;
  }
  return undefined;
}

export function attestationIntentForLabel(label: string): AttestationRule['intent'] | undefined {
  const normalized = normalizeText(label);
  if (normalized.includes('family') && (normalized.includes('employ') || normalized.includes('work'))) {
    return 'family_employment_conflict';
  }
  if (normalized.includes('non compete') || normalized.includes('restrictive covenant') || normalized.includes('obligation')) {
    return 'restrictive_covenant';
  }
  if (normalized.includes('accurate') && normalized.includes('true')) return 'profile_accuracy';
  return undefined;
}

export function matchingAttestationRule(label: string, rules: AttestationRule[]): AttestationRule | undefined {
  const intent = attestationIntentForLabel(label);
  return rules.find((rule) => rule.enabled && rule.intent === intent);
}

export function screeningAnswerForLabel(label: string, profile: CandidateProfile): boolean | undefined {
  const normalized = normalizeText(label);
  if (/sponsor|sponsorship|visa support/.test(normalized)) return profile.employment.requires_sponsorship ?? undefined;
  if (/authorized|authorised|right to work|work permit/.test(normalized)) {
    if (normalized.includes('this country') && profile.employment.work_authorization.some((country) => normalizeText(country) === normalizeText(profile.identity.location.country))) return true;
    return profile.employment.work_authorization.some((country) => normalized.includes(normalizeText(country))) ? true : undefined;
  }
  return undefined;
}
