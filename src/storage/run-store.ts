import type { ApplicationRun } from '../core/run';

const RUNS_KEY = 'application-runs';

export async function getRuns(): Promise<ApplicationRun[]> {
  const value = await chrome.storage.local.get(RUNS_KEY);
  return (value[RUNS_KEY] as ApplicationRun[] | undefined) ?? [];
}

export async function upsertRun(run: ApplicationRun): Promise<void> {
  const runs = await getRuns();
  const index = runs.findIndex((item) => item.tabId === run.tabId);
  if (index >= 0) runs[index] = run; else runs.unshift(run);
  await chrome.storage.local.set({ [RUNS_KEY]: runs.slice(0, 25) });
}

export async function removeRun(tabId: number): Promise<void> {
  await chrome.storage.local.set({ [RUNS_KEY]: (await getRuns()).filter((run) => run.tabId !== tabId) });
}
