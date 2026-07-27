import type { RuntimeMessage } from '../src/core/messages';
import { getProfile, getResume, saveProfile, saveResume } from '../src/storage/profile-store';

const RUNNING_TABS_KEY = 'running-tabs';

async function runningTabs(): Promise<number[]> {
  const value = await chrome.storage.local.get(RUNNING_TABS_KEY);
  return (value[RUNNING_TABS_KEY] as number[] | undefined) ?? [];
}

async function setRunning(tabId: number, running: boolean): Promise<void> {
  const tabs = new Set(await runningTabs());
  if (running) tabs.add(tabId); else tabs.delete(tabId);
  await chrome.storage.local.set({ [RUNNING_TABS_KEY]: [...tabs] });
}

async function fillTab(tabId: number) {
  const profile = await getProfile();
  if (!profile) return { ok: false, error: 'Save your candidate profile first.' };
  const resume = await getResume();
  return chrome.tabs.sendMessage(tabId, { type: 'FILL_WORKDAY', profile, resume });
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
          await setRunning(tab.id, true);
          const response = await fillTab(tab.id);
          return sendResponse(response);
        }
        case 'STOP_ACTIVE_TAB': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) await setRunning(tab.id, false);
          return sendResponse({ ok: true });
        }
        case 'PAGE_READY': {
          const tabId = _sender.tab?.id;
          if (!tabId || !(await runningTabs()).includes(tabId)) return sendResponse({ ok: true, queued: false });
          const response = await fillTab(tabId);
          return sendResponse({ ...response, queued: true });
        }
      }
    })().catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }));
    return true;
  });
  chrome.tabs.onRemoved.addListener((tabId) => void setRunning(tabId, false));
});
