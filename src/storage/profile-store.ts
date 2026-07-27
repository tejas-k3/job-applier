import type { CandidateProfile } from '../core/profile';
import type { ResumeRecord } from '../core/messages';

const PROFILE_KEY = 'candidate-profile';
const RESUME_DB = 'job-applier';
const RESUME_STORE = 'resumes';
const RESUME_KEY = 'default';

export async function getProfile(): Promise<CandidateProfile | null> {
  const value = await chrome.storage.local.get(PROFILE_KEY);
  return (value[PROFILE_KEY] as CandidateProfile | undefined) ?? null;
}

export async function saveProfile(profile: CandidateProfile): Promise<void> {
  await chrome.storage.local.set({ [PROFILE_KEY]: profile });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RESUME_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(RESUME_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveResume(resume: ResumeRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(RESUME_STORE, 'readwrite').objectStore(RESUME_STORE).put(resume, RESUME_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

export async function getResume(): Promise<ResumeRecord | undefined> {
  const db = await openDb();
  const result = await new Promise<ResumeRecord | undefined>((resolve, reject) => {
    const request = db.transaction(RESUME_STORE).objectStore(RESUME_STORE).get(RESUME_KEY);
    request.onsuccess = () => resolve(request.result as ResumeRecord | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}
