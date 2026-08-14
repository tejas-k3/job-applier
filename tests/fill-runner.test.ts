// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runFill } from '../src/automation/fill-runner';
import { emptyProfile, type CandidateProfile } from '../src/core/profile';

const profile: CandidateProfile = {
  ...emptyProfile,
  identity: {
    first_name: 'Tejas', last_name: 'K', email: 'tejas@example.com', phone_e164: '+919999999999', nationality: 'Indian',
    location: { city: 'Hyderabad', region: 'Telangana', country: 'India' },
    links: { linkedin: 'https://linkedin.com/in/tejas', github: 'https://github.com/tejas-k3', portfolio: 'https://tejas.dev' }
  },
  employment: { work_authorization: ['India'], requires_sponsorship: false, notice_period: '30 days' },
  experience: [{ company: 'Acme', title: 'Engineer', summary: 'Built APIs' }],
  education: [], skills: [], attestation_rules: []
};

beforeEach(() => {
  document.body.innerHTML = '';
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
});

describe('runFill', () => {
  it('fills supported required fields and advances only after values are present', async () => {
    document.body.innerHTML = `
      <label>First Name <input required></label>
      <label>Email Address <input required></label>
      <label>Country <select required><option value="">Choose</option><option value="IN">India</option></select></label>
      <button type="button">Next</button>`;
    const next = document.querySelector('button')!;
    const clicked = vi.fn();
    next.addEventListener('click', clicked);

    const result = await runFill(profile);

    expect((document.querySelectorAll('input')[0] as HTMLInputElement).value).toBe('Tejas');
    expect((document.querySelectorAll('input')[1] as HTMLInputElement).value).toBe('tejas@example.com');
    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('IN');
    expect(result.nextAction).toBe('advanced');
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('stops instead of advancing when a required field cannot be resolved', async () => {
    document.body.innerHTML = `<label>Favourite colour <input required></label><button type="button">Next</button>`;
    const clicked = vi.fn();
    document.querySelector('button')!.addEventListener('click', clicked);

    const result = await runFill(profile);

    expect(result.nextAction).toBe('waiting');
    expect(result.items.some((item) => item.state === 'unresolved')).toBe(true);
    expect(clicked).not.toHaveBeenCalled();
  });

  it('selects a real career-website source option instead of guessing', async () => {
    document.body.innerHTML = `<label>How did you hear about us?<select required><option value="">Choose</option><option value="linkedin">LinkedIn</option><option value="careers">Company careers website</option></select></label>`;

    const result = await runFill(profile);

    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('careers');
    expect(result.items.some((entry) => entry.field.intent === 'application_source' && entry.state === 'filled')).toBe(true);
  });

  it('does not choose a non-career source when the preferred answer is absent', async () => {
    document.body.innerHTML = `<label>Where did you hear about us?<select required><option value="">Choose</option><option value="linkedin">LinkedIn</option></select></label>`;

    const result = await runFill(profile);

    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('');
    expect(result.items.some((entry) => entry.field.intent === 'application_source' && entry.state === 'blocked')).toBe(true);
  });

  it('stops for authentication and verification handoffs', async () => {
    document.body.innerHTML = `<h1>Sign in</h1><label>Password <input type="password" required></label>`;

    const result = await runFill(profile);

    expect(result.nextAction).toBe('waiting');
    expect(result.items[0]?.message).toMatch(/sign in/i);
  });

  it('requires a matching ARIA combobox option before reporting success', async () => {
    document.body.innerHTML = `<label>Country <input role="combobox" required></label>`;

    const result = await runFill(profile);

    expect((document.querySelector('input') as HTMLInputElement).value).toBe('');
    expect(result.items.some((entry) => entry.message.includes('combobox option'))).toBe(true);
    expect(result.nextAction).toBe('waiting');
  });

  it('selects a unique country label and Workday-style date dropdowns', async () => {
    const datedProfile = { ...profile, experience: [{ ...profile.experience[0], start_date: '2021-01-01' }] };
    document.body.innerHTML = `
      <label>Country <select required><option value="">Choose</option><option value="IN">India (IN)</option></select></label>
      <label>Work experience start month <select required><option value="">Choose</option><option value="01">January</option></select></label>
      <label>Work experience start year <select required><option value="">Choose</option><option value="2021">2021</option></select></label>`;

    const result = await runFill(datedProfile);

    expect(Array.from(document.querySelectorAll('select')).map((control) => control.value)).toEqual(['IN', '01', '2021']);
    expect(result.items.every((entry) => entry.state === 'filled')).toBe(true);
  });

  it('does not select an ambiguous dropdown option', async () => {
    const usProfile = { ...profile, identity: { ...profile.identity, location: { ...profile.identity.location, country: 'United States' } } };
    document.body.innerHTML = `<label>Country <select required><option value="">Choose</option><option value="US">United States</option><option value="UM">United States Minor Outlying Islands</option></select></label>`;

    const result = await runFill(usProfile);

    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('US');
    expect(result.items[0]?.state).toBe('filled');
  });

  it('fills Workday-style region, notice period, and native screening selects', async () => {
    document.body.innerHTML = `
      <label>State or Province <select required><option value="">Choose</option><option value="TG">Telangana</option></select></label>
      <label>Notice period <select required><option value="">Choose</option><option value="30">30 days</option></select></label>
      <label>Are you authorized to work in India?<select required><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select></label>
      <label>Will you require sponsorship now or in the future?<select required><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select></label>`;

    const result = await runFill(profile);

    expect(Array.from(document.querySelectorAll('select')).map((control) => control.value)).toEqual(['TG', '30', 'yes', 'no']);
    expect(result.items.every((entry) => entry.state === 'filled')).toBe(true);
  });
});
