import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'DK CourtFest — Check-in',
        short_name: 'DKCF Check-in',
        description: 'Billetterie & présence — DK CourtFest',
        theme_color: '#FF5C00',
        background_color: '#0A0A0C',
        display: 'standalone',
        start_url: '/admin/checkin',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      // App shell is precached for offline; ticket data is handled by IndexedDB.
      workbox: { navigateFallback: '/index.html' },
      devOptions: { enabled: false },
    }),
  ],
})
