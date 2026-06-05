import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "https://learn-hub-rho-ashen.vercel.app",
        changeOrigin: true,
      },
      "/Images": {
        target: "https://learn-hub-rho-ashen.vercel.app",
        changeOrigin: true,
      },
      "/Videos": {
        target: "https://learn-hub-rho-ashen.vercel.app",
        changeOrigin: true,
      },
      "/Files": {
        target: "https://learn-hub-rho-ashen.vercel.app",
        changeOrigin: true,
      },
    },
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, ".."),
      ],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "og-image.png",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: {
        id: "/",
        name: "LearnHub",
        short_name: "LearnHub",
        description:
          "LearnHub mobile learning app for courses, assessments, certificates, and AI tutoring.",
        theme_color: "#0f766e",
        background_color: "#f8fafc",
        lang: "en",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        prefer_related_applications: false,
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.vercel\.app\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "learnhub-api",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "learnhub-api-relative",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "learnhub-fonts",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
