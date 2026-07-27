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

  useEffect(() => {
    void (async () => {
      const { profile } = await send<{ profile: CandidateProfile | null }>({ type: 'GET_PROFILE' });
      if (profile) setText(JSON.stringify(profile, null, 2));
      const { resume } = await send<{ resume: { name: string } | null }>({ type: 'GET_RESUME_META' });
      if (resume) setResumeName(resume.name);
      const result = await send<{ runs: ApplicationRun[] }>({ type: 'GET_RUNS' });
      setRuns(result.runs);
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

  async function stopTab() {
    await send<{ ok: boolean }>({ type: 'STOP_ACTIVE_TAB' });
    setStatus('Stopped background filling for this tab.');
  }

  function exportProfile() {
    const blob = new Blob([text], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'candidate-profile.json'; link.click(); URL.revokeObjectURL(link.href);
  }

  return <main>
    <h1>Job Applier</h1><p className="sub">Workday-first safe fill. You review and submit.</p>
    <section><h2>1. Candidate profile</h2><textarea value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} /><div className="row"><button onClick={saveProfile}>Save profile</button><button className="secondary" onClick={exportProfile}>Export JSON</button></div></section>
    <section><h2>2. PDF resume</h2><p>{resumeName}</p><input type="file" accept="application/pdf" onChange={(event) => void chooseResume(event.target.files?.[0])} /></section>
    <section><h2>3. Run current job tab</h2><button className="fill" onClick={() => void fillTab()}>Start background fill</button><button className="secondary" onClick={() => void stopTab()}>Stop this tab</button><p className="status">{status}</p></section>
    <section><h2>Application queue</h2>{runs.length ? <ul className="runs">{runs.map((run) => <li key={run.tabId}><strong>{run.provider}</strong> · {run.status}<br /><small>{run.message}</small></li>)}</ul> : <p>No active application runs.</p>}</section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
