import type { RuntimeMessage } from '../src/core/messages';
import { getProfile, getResume, saveProfile, saveResume } from '../src/storage/profile-store';
import { getRuns, removeRun, upsertRun } from '../src/storage/run-store';
import { detectProvider, isSupportedApplicationUrl } from '../src/adapters/provider';

async function fillTab(tabId: number, url = '') {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: 'Save your candidate profile first.' };
  const resume = await getResume();
  await upsertRun({ tabId, url, provider: detectProvider(url), status: 'filling', message: 'Inspecting visible fields', updatedAt: new Date().toISOString() });
  let response: unknown;
  try {
    response = await chrome.tabs.sendMessage(tabId, { type: 'FILL_WORKDAY', profile, resume });
  } catch (error) {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content-scripts/content.js'] });
      response = await chrome.tabs.sendMessage(tabId, { type: 'FILL_WORKDAY', profile, resume });
    } catch (injectionError) {
      const message = injectionError instanceof Error ? injectionError.message : (error instanceof Error ? error.message : 'Could not connect to this application page');
      await upsertRun({ tabId, url, provider: detectProvider(url), status: 'failed', message, updatedAt: new Date().toISOString() });
      return { ok: false, error: message };
    }
  }
  const report = response as { ok: boolean; report?: string[]; nextAction?: 'advanced' | 'review' | 'waiting'; stage?: string; error?: string };
  await upsertRun({
    tabId, url, provider: detectProvider(url),
    status: !report.ok ? 'failed' : report.nextAction === 'advanced' ? 'filling' : report.nextAction === 'waiting' ? 'waiting_for_user' : 'ready_for_review',
    message: report.error ?? (report.stage ? `${report.stage}: ${report.report?.at(-1) ?? 'Awaiting page update'}` : report.report?.at(-1) ?? 'Awaiting page update'), updatedAt: new Date().toISOString()
  });
  return report;
}

async function fillSupportedTabs() {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: 'Save your candidate profile first.' };

  const tabs = await chrome.tabs.query({});
  const runs = await getRuns();
  const candidates = tabs.filter((tab) => tab.id !== undefined && isSupportedApplicationUrl(tab.url ?? ''));
  const eligible = candidates.filter((tab) => {
    const run = runs.find((item) => item.tabId === tab.id);
    return !run || run.status === 'stopped' || run.status === 'failed';
  });
  const results = await Promise.all(eligible.map((tab) => fillTab(tab.id!, tab.url ?? '')));
  const started = results.filter((result) => result.ok).length;
  return {
    ok: true,
    started,
    found: candidates.length,
    skipped: candidates.length - eligible.length,
    failed: results.length - started
  };
}

async function stopTab(tabId: number) {
  const previous = (await getRuns()).find((run) => run.tabId === tabId);
  if (previous) await upsertRun({ ...previous, status: 'stopped', message: 'Stopped by candidate', updatedAt: new Date().toISOString() });
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
        case 'FILL_SUPPORTED_TABS': return sendResponse(await fillSupportedTabs());
        case 'STOP_ACTIVE_TAB': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) await stopTab(tab.id);
          return sendResponse({ ok: true });
        }
        case 'STOP_TAB': await stopTab(message.tabId); return sendResponse({ ok: true });
        case 'RESUME_TAB': {
          const tab = await chrome.tabs.get(message.tabId);
          if (!tab?.id) return sendResponse({ ok: false, error: 'Application tab is no longer open.' });
          return sendResponse(await fillTab(tab.id, tab.url ?? ''));
        }
        case 'OPEN_TAB': await chrome.tabs.update(message.tabId, { active: true }); return sendResponse({ ok: true });
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
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    void (async () => {
      const run = (await getRuns()).find((item) => item.tabId === tabId);
      if (!run || run.status !== 'filling') return;
      await fillTab(tabId, tab.url ?? run.url);
    })();
  });
});
