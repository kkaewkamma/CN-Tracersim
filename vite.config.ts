import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.svg'],
      manifest: {
        name: 'CN-Tracersim v5.2 - Cisco Packet Tracer & Network Simulator',
        short_name: 'CN-Tracersim',
        description: 'Interactive Cisco IOS CLI & Network Topology Simulator with NetAcad Learning Coach',
        theme_color: '#0b111a',
        background_color: '#0b111a',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@application': path.resolve(__dirname, './src/application'),
      '@presentation': path.resolve(__dirname, './src/presentation')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts']
  }
});

