import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Subtle — Live Meeting Subtitles',
  version: '0.1.0',
  description: 'Real-time translated subtitles for Google Meet, 100% on-device.',

  permissions: [
    'tabCapture',
    'offscreen',
    'storage',
    'activeTab',
  ],

  host_permissions: [
    'https://meet.google.com/*',
  ],

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['https://meet.google.com/*'],
      js: ['src/content/content.ts'],
      run_at: 'document_idle',
    },
  ],

  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'public/icons/icon16.png',
      '48': 'public/icons/icon48.png',
      '128': 'public/icons/icon128.png',
    },
  },

  icons: {
    '16': 'public/icons/icon16.png',
    '48': 'public/icons/icon48.png',
    '128': 'public/icons/icon128.png',
  },
})
