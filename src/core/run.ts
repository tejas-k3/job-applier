import type { Provider } from './application';

export type RunStatus = 'queued' | 'filling' | 'waiting_for_user' | 'ready_for_review' | 'stopped' | 'failed';

export type ApplicationRun = {
  tabId: number;
  url: string;
  provider: Provider;
  status: RunStatus;
  message: string;
  updatedAt: string;
};
