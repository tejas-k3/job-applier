import type { Provider } from '../core/application';

export function detectProvider(url: string): Provider {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('myworkdayjobs.com')) return 'workday';
  if (host === 'jobs.lever.co' || host.endsWith('.lever.co')) return 'lever';
  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') return 'greenhouse';
  if (host === 'jobs.ashbyhq.com' || host.endsWith('.ashbyhq.com')) return 'ashby';
  if (host.endsWith('.sapsf.eu') || host.endsWith('.successfactors.com')) return 'successfactors';
  if (host === 'n26.com') return 'greenhouse';
  return 'generic';
}

/**
 * Keeps bulk filling deliberately narrow: a background scan should only touch
 * tabs that look like individual applications on an allowed ATS, never every
 * page open in the browser.
 */
export function isSupportedApplicationUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  if (host.includes('myworkdayjobs.com')) return /\/job\/|\/apply(?:\/|$)/.test(path);
  if (host === 'jobs.lever.co' || host.endsWith('.lever.co')) return path.split('/').filter(Boolean).length >= 2;
  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') return /\/jobs\/|\/embed\/job_app/.test(path);
  if (host === 'jobs.ashbyhq.com' || host.endsWith('.ashbyhq.com')) return path.split('/').filter(Boolean).length >= 2;
  if (host.endsWith('.sapsf.eu') || host.endsWith('.successfactors.com')) return /\/career\/job\//.test(path) || parsed.searchParams.has('jobId');
  if (host === 'bolt.eu') return /\/careers\/positions\//.test(path);
  if (host === 'wise.jobs') return /\/job\/|\/workflow$/i.test(path) || parsed.searchParams.has('workflowId');
  if (host === 'n26.com') return /\/careers\/positions\/[^/]+(?:\/apply)?$/.test(path);
  return false;
}

export function providerDisplayName(provider: Provider): string {
  return provider === 'workday'
    ? 'Workday'
    : provider === 'lever'
      ? 'Lever'
      : provider === 'greenhouse'
        ? 'Greenhouse'
        : provider === 'ashby'
          ? 'Ashby'
          : provider === 'successfactors'
            ? 'SAP SuccessFactors'
            : 'Custom application';
}
