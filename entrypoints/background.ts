import type { RuntimeMessage } from '../src/core/messages';
import { getProfile, getResume, saveProfile, saveResume } from '../src/storage/profile-store';
import { getRuns, removeRun, upsertRun } from '../src/storage/run-store';
import { detectProvider } from '../src/adapters/provider';

async function fillTab(tabId: number, url = '') {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: 'Save your candidate profile first.' };
  const resume = await getResume();
  await upsertRun({ tabId, url, provider: detectProvider(url), status: 'filling', message: 'Inspecting visible fields', updatedAt: new Date().toISOString() });
  const response = await chrome.tabs.sendMessage(tabId, { type: 'FILL_WORKDAY', profile, resume });
  const report = response as { ok: boolean; report?: string[]; nextAction?: 'advanced' | 'review' | 'waiting'; error?: string };
  await upsertRun({
    tabId, url, provider: detectProvider(url),
    status: !report.ok ? 'failed' : report.nextAction === 'advanced' ? 'filling' : report.nextAction === 'waiting' ? 'waiting_for_user' : 'ready_for_review',
    message: report.error ?? report.report?.at(-1) ?? 'Awaiting page update', updatedAt: new Date().toISOString()
  });
  return report;
}

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case 'GET_PROFILE': return sendResponse({ profile: await getProfile() });
        case 'SAVE_PROFILE': await saveProfile(message.profile); return sendResponse({ ok: true });
        case 'SAVE_RESUME': await saveResume(message.resume); return sendResponse({ ok: true });
        case 'GET_RESUME_META': {
          const resume = await getResume();
          return sendResponse({ resume: resume ? { name: resume.name, savedAt: resume.savedAt } : null });
        }
        case 'FILL_ACTIVE_TAB': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) return sendResponse({ ok: false, error: 'No active tab found.' });
          const response = await fillTab(tab.id, tab.url ?? '');
          return sendResponse(response);
        }
        case 'STOP_ACTIVE_TAB': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            const previous = (await getRuns()).find((run) => run.tabId === tab.id);
            if (previous) await upsertRun({ ...previous, status: 'stopped', message: 'Stopped by candidate', updatedAt: new Date().toISOString() });
          }
          return sendResponse({ ok: true });
        }
        case 'GET_RUNS': return sendResponse({ runs: await getRuns() });
        case 'PAGE_READY': {
          const tabId = _sender.tab?.id;
          const run = tabId ? (await getRuns()).find((item) => item.tabId === tabId) : undefined;
          if (!tabId || !run || run.status === 'stopped' || run.status === 'ready_for_review' || run.status === 'waiting_for_user') return sendResponse({ ok: true, queued: false });
          const response = await fillTab(tabId, _sender.tab?.url ?? run.url);
          return sendResponse({ ...response, queued: true });
        }
      }
    })().catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }));
    return true;
  });
  chrome.tabs.onRemoved.addListener((tabId) => void removeRun(tabId));
});
