import { describe, expect, it } from 'vitest';
import { attestationIntentForLabel, matchingAttestationRule, profileValueForLabel, profileValueForOccurrence, screeningAnswerForLabel } from '../src/core/field-mapping';
import { emptyProfile } from '../src/core/profile';

const profile = {
  ...emptyProfile,
  identity: {
    first_name: 'Tejas', last_name: 'K', email: 'tejas@example.com', phone_e164: '+919999999999', nationality: 'Indian',
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
    expect(profileValueForLabel('Nationality', profile)).toBe('Indian');
    expect(profileValueForLabel('Name', profile)).toBe('Tejas K');
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

describe('repeatable profile data', () => {
  it('maps sequential work-experience fields', () => {
    const richProfile = { ...profile, experience: [
      { company: 'Acme', title: 'Backend Engineer', summary: 'Built APIs', start_date: '2021-01-01', end_date: '2023-06-01' },
      { company: 'Globex', title: 'Platform Engineer', summary: 'Improved reliability', start_date: '2023-07-01' }
    ], education: [{ school: 'Example University', degree: 'B.Tech', start_date: '2017-08-01', end_date: '2021-05-01' }] };
    expect(profileValueForOccurrence('Employer name', richProfile, 0)).toBe('Acme');
    expect(profileValueForOccurrence('Employer name', richProfile, 1)).toBe('Globex');
    expect(profileValueForOccurrence('Job title', richProfile, 1)).toBe('Platform Engineer');
    expect(profileValueForOccurrence('Work experience start date', richProfile, 0)).toBe('2021-01-01');
    expect(profileValueForOccurrence('Work experience end date', richProfile, 0)).toBe('2023-06-01');
    expect(profileValueForOccurrence('Education start date', richProfile, 0)).toBe('2017-08-01');
    expect(profileValueForOccurrence('University end date', richProfile, 0)).toBe('2021-05-01');
  });
});

describe('locked screening answers', () => {
  it('only answers country-specific work authorization from the profile', () => {
    const screenedProfile = { ...profile, employment: { ...profile.employment, work_authorization: ['India'], requires_sponsorship: false } };
    expect(screeningAnswerForLabel('Are you authorized to work in India?', screenedProfile)).toBe(true);
    expect(screeningAnswerForLabel('Are you legally authorized to work in this country?', screenedProfile)).toBe(true);
    expect(screeningAnswerForLabel('Will you require sponsorship now or in the future?', screenedProfile)).toBe(false);
    expect(screeningAnswerForLabel('Are you authorized to work in Germany?', screenedProfile)).toBeUndefined();
  });
});
