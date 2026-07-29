import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Job Applier',
    description: 'Workday-first application filling with an explicit review step.',
    permissions: ['storage', 'tabs', 'sidePanel', 'activeTab', 'scripting'],
    host_permissions: [
      'https://*.myworkdayjobs.com/*',
      'https://jobs.lever.co/*',
      'https://boards.greenhouse.io/*',
      'https://job-boards.greenhouse.io/*',
      'https://jobs.ashbyhq.com/*',
      'https://bolt.eu/*',
      'https://wise.jobs/*'
    ],
    side_panel: { default_path: 'sidepanel.html' },
    action: { default_title: 'Open Job Applier' }
  }
});
