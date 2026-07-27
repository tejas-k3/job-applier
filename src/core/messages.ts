import type { CandidateProfile } from './profile';

export type ResumeRecord = { name: string; dataUrl: string; savedAt: string };

export type RuntimeMessage =
  | { type: 'GET_PROFILE' }
  | { type: 'SAVE_PROFILE'; profile: CandidateProfile }
  | { type: 'SAVE_RESUME'; resume: ResumeRecord }
  | { type: 'GET_RESUME_META' }
  | { type: 'FILL_ACTIVE_TAB' }
  | { type: 'STOP_ACTIVE_TAB' }
  | { type: 'PAGE_READY' }
  | { type: 'FILL_WORKDAY'; profile: CandidateProfile; resume?: ResumeRecord };
