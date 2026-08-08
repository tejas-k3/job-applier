import type { CandidateProfile } from './profile';

export type ResumeRecord = { name: string; dataUrl: string; savedAt: string };

export type RuntimeMessage =
  | { type: 'GET_PROFILE' }
  | { type: 'SAVE_PROFILE'; profile: CandidateProfile }
  | { type: 'SAVE_RESUME'; resume: ResumeRecord }
  | { type: 'GET_RESUME_META' }
  | { type: 'FILL_ACTIVE_TAB' }
  | { type: 'FILL_SUPPORTED_TABS' }
  | { type: 'STOP_ACTIVE_TAB' }
  | { type: 'STOP_TAB'; tabId: number }
  | { type: 'RESUME_TAB'; tabId: number }
  | { type: 'OPEN_TAB'; tabId: number }
  | { type: 'GET_RUNS' }
  | { type: 'PAGE_READY' }
  | { type: 'FILL_WORKDAY'; profile: CandidateProfile; resume?: ResumeRecord };
