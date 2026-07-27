import type { Provider } from '../core/application';

export function detectProvider(url: string): Provider {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('myworkdayjobs.com')) return 'workday';
  if (host === 'jobs.lever.co' || host.endsWith('.lever.co')) return 'lever';
  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') return 'greenhouse';
  if (host === 'jobs.ashbyhq.com' || host.endsWith('.ashbyhq.com')) return 'ashby';
  return 'generic';
}

export function providerDisplayName(provider: Provider): string {
  return provider === 'workday' ? 'Workday' : provider === 'lever' ? 'Lever' : provider === 'greenhouse' ? 'Greenhouse' : provider === 'ashby' ? 'Ashby' : 'Custom application';
}
