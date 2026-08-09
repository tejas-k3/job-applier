import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { RuntimeMessage } from '../../src/core/messages';
import { emptyProfile, isProfile, type CandidateProfile } from '../../src/core/profile';
import type { ApplicationRun } from '../../src/core/run';
import './style.css';

function send<T>(message: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

function App() {
  const [text, setText] = useState(JSON.stringify(emptyProfile, null, 2));
  const [status, setStatus] = useState('Set up your profile and choose a PDF resume.');
  const [resumeName, setResumeName] = useState('No PDF saved');
  const [runs, setRuns] = useState<ApplicationRun[]>([]);
  const [autoFillEnabled, setAutoFillEnabled] = useState(false);

  useEffect(() => {
    void (async () => {
      const { profile } = await send<{ profile: CandidateProfile | null }>({ type: 'GET_PROFILE' });
      if (profile) setText(JSON.stringify(profile, null, 2));
      const { resume } = await send<{ resume: { name: string } | null }>({ type: 'GET_RESUME_META' });
      if (resume) setResumeName(resume.name);
      const result = await send<{ runs: ApplicationRun[] }>({ type: 'GET_RUNS' });
      setRuns(result.runs);
      const autoFill = await send<{ enabled: boolean }>({ type: 'GET_AUTO_FILL_ENABLED' });
      setAutoFillEnabled(autoFill.enabled);
    })();
  }, []);

  async function saveProfile() {
    try {
      const profile: unknown = JSON.parse(text);
      if (!isProfile(profile)) throw new Error('Profile must follow schema_version 1 and include identity and employment.');
      await send({ type: 'SAVE_PROFILE', profile });
      setStatus('Candidate profile saved.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Invalid profile JSON.'); }
  }

  async function chooseResume(file?: File) {
    if (!file) return;
    if (file.type !== 'application/pdf') return setStatus('Resume must be a PDF.');
    if (file.size > 8 * 1024 * 1024) return setStatus('Resume must be 8 MB or smaller for this MVP.');
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file);
    });
    await send({ type: 'SAVE_RESUME', resume: { name: file.name, dataUrl, savedAt: new Date().toISOString() } });
    setResumeName(file.name); setStatus('PDF resume saved locally.');
  }

  async function fillTab() {
    const result = await send<{ ok: boolean; error?: string; report?: string[] }>({ type: 'FILL_ACTIVE_TAB' });
    setStatus(result.ok ? (result.report ?? []).join(' • ') : (result.error ?? 'Fill failed.'));
    const updated = await send<{ runs: ApplicationRun[] }>({ type: 'GET_RUNS' });
    setRuns(updated.runs);
  }

  async function fillSupportedTabs() {
    const result = await send<{ ok: boolean; error?: string; found?: number; started?: number; skipped?: number; failed?: number }>({ type: 'FILL_SUPPORTED_TABS' });
    setStatus(result.ok
      ? `Found ${result.found ?? 0} supported application tab(s); started ${result.started ?? 0}, skipped ${result.skipped ?? 0}, failed ${result.failed ?? 0}.`
      : (result.error ?? 'Unable to scan application tabs.'));
    const updated = await send<{ runs: ApplicationRun[] }>({ type: 'GET_RUNS' });
    setRuns(updated.runs);
  }

  async function toggleAutoFill(enabled: boolean) {
    const result = await send<{ ok: boolean; error?: string; found?: number; started?: number }>({ type: 'SET_AUTO_FILL_ENABLED', enabled });
    if (!result.ok) return setStatus(result.error ?? 'Unable to change auto-fill setting.');
    setAutoFillEnabled(enabled);
    setStatus(enabled ? `Background watch enabled. Started ${result.started ?? 0} of ${result.found ?? 0} open supported application tab(s).` : 'Background watch disabled. Existing runs are unchanged.');
    const updated = await send<{ runs: ApplicationRun[] }>({ type: 'GET_RUNS' });
    setRuns(updated.runs);
  }

  async function stopTab() {
    await send<{ ok: boolean }>({ type: 'STOP_ACTIVE_TAB' });
    setStatus('Stopped background filling for this tab.');
  }

  async function controlRun(type: 'STOP_TAB' | 'RESUME_TAB' | 'OPEN_TAB', tabId: number) {
    const result = await send<{ ok: boolean; error?: string }>({ type, tabId });
    setStatus(result.ok ? (type === 'OPEN_TAB' ? 'Opened application tab.' : type === 'RESUME_TAB' ? 'Resumed background fill.' : 'Stopped background fill.') : (result.error ?? 'Unable to update this run.'));
    const updated = await send<{ runs: ApplicationRun[] }>({ type: 'GET_RUNS' });
    setRuns(updated.runs);
  }

  async function copyLinkedInBasics() {
    try {
      const profile: unknown = JSON.parse(text);
      if (!isProfile(profile)) throw new Error('Save a valid profile first.');
      const lines = [
        `Name: ${profile.identity.first_name} ${profile.identity.last_name}`.trim(),
        `Email: ${profile.identity.email}`,
        `Phone: ${profile.identity.phone_e164}`,
        `Location: ${[profile.identity.location.city, profile.identity.location.region, profile.identity.location.country].filter(Boolean).join(', ')}`,
        `LinkedIn: ${profile.identity.links.linkedin}`,
        `GitHub: ${profile.identity.links.github}`
      ].filter((line) => !line.endsWith(': '));
      await navigator.clipboard.writeText(lines.join('\n'));
      setStatus('Profile basics copied for manual LinkedIn Easy Apply entry.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to copy profile basics.'); }
  }

  function exportProfile() {
    const blob = new Blob([text], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'candidate-profile.json'; link.click(); URL.revokeObjectURL(link.href);
  }

  return <main>
    <h1>Job Applier</h1><p className="sub">Workday-first safe fill. You review and submit.</p>
    <section><h2>1. Candidate profile</h2><textarea value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} /><div className="row"><button onClick={saveProfile}>Save profile</button><button className="secondary" onClick={exportProfile}>Export JSON</button></div></section>
    <section><h2>2. PDF resume</h2><p>{resumeName}</p><input type="file" accept="application/pdf" onChange={(event) => void chooseResume(event.target.files?.[0])} /></section>
    <section><h2>3. Fill application tabs</h2><label><input type="checkbox" checked={autoFillEnabled} onChange={(event) => void toggleAutoFill(event.target.checked)} /> Watch new supported job tabs and fill in background</label><button className="fill" onClick={() => void fillSupportedTabs()}>Fill all supported tabs now</button><button className="secondary" onClick={() => void fillTab()}>Fill current tab</button><button className="secondary" onClick={() => void stopTab()}>Stop this tab</button><p className="status">{status}</p><p className="sub">The watcher never focuses tabs. Open a supported application page and it queues automatically after loading.</p></section>
    <section><h2>LinkedIn Easy Apply</h2><p>Manual copy-assist only. LinkedIn form filling and clicks are never automated.</p><button className="secondary" onClick={() => void copyLinkedInBasics()}>Copy profile basics</button></section>
    <section><h2>Application queue</h2>{runs.length ? <ul className="runs">{runs.map((run) => <li key={run.tabId}><strong>{run.provider}</strong> · {run.status}<br /><small>{run.message}</small><div className="row"><button className="secondary" onClick={() => void controlRun('OPEN_TAB', run.tabId)}>Open</button>{run.status === 'filling' ? <button className="secondary" onClick={() => void controlRun('STOP_TAB', run.tabId)}>Stop</button> : <button className="secondary" onClick={() => void controlRun('RESUME_TAB', run.tabId)}>Resume</button>}</div></li>)}</ul> : <p>No active application runs.</p>}</section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
