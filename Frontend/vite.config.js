import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "https://learn-hub-rho-ashen.vercel.app/",
        changeOrigin: true,
      },
    },
    fs: {
      // السماح لـ Vite بالوصول إلى الملفات في المجلد الرئيسي والمجلدات الأب
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, ".."),
      ],
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));