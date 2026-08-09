import { describe, expect, it } from 'vitest';
import { detectProvider, isSupportedApplicationUrl } from '../src/adapters/provider';

describe('provider detection', () => {
  it('recognizes the supported hosted providers', () => {
    expect(detectProvider('https://acme.wd5.myworkdayjobs.com/en-US/jobs')).toBe('workday');
    expect(detectProvider('https://jobs.lever.co/acme/123')).toBe('lever');
    expect(detectProvider('https://boards.greenhouse.io/acme/jobs/123')).toBe('greenhouse');
    expect(detectProvider('https://jobs.ashbyhq.com/acme/123')).toBe('ashby');
    expect(detectProvider('https://career55.sapsf.eu/careers?company=volvoinfor')).toBe('successfactors');
    expect(detectProvider('https://n26.com/en-eu/careers/positions/7996816')).toBe('greenhouse');
  });
});

describe('bulk application URL detection', () => {
  it('selects individual application pages and ignores job boards', () => {
    expect(isSupportedApplicationUrl('https://acme.wd5.myworkdayjobs.com/en-US/job/India/Engineer_123')).toBe(true);
    expect(isSupportedApplicationUrl('https://acme.wd5.myworkdayjobs.com/en-US/jobs')).toBe(false);
    expect(isSupportedApplicationUrl('https://jobs.lever.co/acme/abc123')).toBe(true);
    expect(isSupportedApplicationUrl('https://job-boards.greenhouse.io/acme/jobs/1234')).toBe(true);
    expect(isSupportedApplicationUrl('https://jobs.ashbyhq.com/acme/abc123')).toBe(true);
    expect(isSupportedApplicationUrl('https://career55.sapsf.eu/careers?company=volvoinfor')).toBe(false);
    expect(isSupportedApplicationUrl('https://career55.sapsf.eu/career/job/123?company=volvoinfor')).toBe(true);
    expect(isSupportedApplicationUrl('https://n26.com/en-eu/careers/positions/7996816')).toBe(true);
    expect(isSupportedApplicationUrl('https://example.com/about')).toBe(false);
  });
});
