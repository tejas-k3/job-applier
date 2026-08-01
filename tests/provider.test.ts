import { describe, expect, it } from 'vitest';
import { detectProvider } from '../src/adapters/provider';

describe('provider detection', () => {
  it('recognizes the supported hosted providers', () => {
    expect(detectProvider('https://acme.wd5.myworkdayjobs.com/en-US/jobs')).toBe('workday');
    expect(detectProvider('https://jobs.lever.co/acme/123')).toBe('lever');
    expect(detectProvider('https://boards.greenhouse.io/acme/jobs/123')).toBe('greenhouse');
    expect(detectProvider('https://jobs.ashbyhq.com/acme/123')).toBe('ashby');
    expect(detectProvider('https://career55.sapsf.eu/careers?company=volvoinfor')).toBe('successfactors');
  });
});
