import { describe, expect, it } from 'vitest';
import { attestationIntentForLabel, matchingAttestationRule, profileValueForLabel } from '../src/core/field-mapping';
import { emptyProfile } from '../src/core/profile';

const profile = {
  ...emptyProfile,
  identity: {
    first_name: 'Tejas', last_name: 'K', email: 'tejas@example.com', phone_e164: '+919999999999',
    location: { city: 'Hyderabad', region: 'Telangana', country: 'India' },
    links: { linkedin: 'https://linkedin.com/in/tejas', github: 'https://github.com/tejas-k3', portfolio: 'https://tejas.dev' }
  }
};

describe('profileValueForLabel', () => {
  it('maps common Workday-style labels', () => {
    expect(profileValueForLabel('Legal First Name', profile)).toBe('Tejas');
    expect(profileValueForLabel('Primary Email Address', profile)).toBe('tejas@example.com');
    expect(profileValueForLabel('Mobile Phone Number', profile)).toBe('+919999999999');
    expect(profileValueForLabel('GitHub profile URL', profile)).toBe('https://github.com/tejas-k3');
    expect(profileValueForLabel('Country of residence', profile)).toBe('India');
  });

  it('does not guess an unknown question', () => {
    expect(profileValueForLabel('Describe your greatest achievement', profile)).toBeUndefined();
  });
});

describe('attestation mapping', () => {
  it('recognizes family-employment and restrictive-obligation declarations', () => {
    expect(attestationIntentForLabel('Do you have a family member employed by this company?')).toBe('family_employment_conflict');
    expect(attestationIntentForLabel('Are you bound by a restrictive covenant or non-compete?')).toBe('restrictive_covenant');
  });

  it('only returns enabled pre-approved rules', () => {
    expect(matchingAttestationRule('Is your information true and accurate?', profile.attestation_rules)).toBeUndefined();
  });
});
