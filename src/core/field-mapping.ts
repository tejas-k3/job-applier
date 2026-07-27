import type { AttestationRule, CandidateProfile } from './profile';

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function profileValueForLabel(label: string, profile: CandidateProfile): string | undefined {
  const normalized = normalizeText(label);
  const { identity } = profile;
  if (/\b(last|family|surname)\b/.test(normalized)) return identity.last_name;
  if (/\b(first|given)\b/.test(normalized)) return identity.first_name;
  if (/email/.test(normalized)) return identity.email;
  if (/\b(phone|mobile|telephone)\b/.test(normalized)) return identity.phone_e164;
  if (/linkedin/.test(normalized)) return identity.links.linkedin;
  if (/github/.test(normalized)) return identity.links.github;
  if (/portfolio personal website website url/.test(normalized)) return identity.links.portfolio;
  if (/city/.test(normalized)) return identity.location.city;
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
